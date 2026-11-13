#!/usr/bin/env python3
"""Block direct Codex tool writes to Changeset fragment files."""

import json
import re
import sys
from pathlib import Path


FRAGMENT_PATH = re.compile(
    r"(?<![\w.-])\.changeset[\\/][^\\/\s\"'`]+\.md(?:$|[\s\"'`)])",
    re.IGNORECASE,
)
PATCH_FILE = re.compile(
    r"^\s*\*\*\*\s+(?:(?:Add|Update|Delete)\s+File|Move to):\s*(.*?)\s*$",
    re.MULTILINE,
)
EMBEDDED_COMMAND = re.compile(r"(?:cmd|command)\s*:\s*(['\"])(.*?)\1", re.DOTALL)
SAFE_BASH = re.compile(
    r"^\s*(?:git\s+(?:status|diff|show|log|ls-files|add)\b|"
    r"(?:ls|cat|head|tail|less|more|sed|rg|grep|stat|file|wc)\b)"
)
SHELL_CONTROL = re.compile(r"[;&|<>`] |\$\(", re.VERBOSE)


def is_changeset_fragment(path: str, cwd: str) -> bool:
    candidate = Path(path).expanduser()
    if not candidate.is_absolute():
        candidate = Path(cwd) / candidate

    candidate = candidate.resolve(strict=False)
    return candidate.suffix.lower() == ".md" and candidate.parent.name == ".changeset"


def is_inside_changesets(cwd: str) -> bool:
    path = Path(cwd).resolve(strict=False)
    return path.name == ".changeset" or ".changeset" in path.parts


def is_nonwriting_shell_command(command: str) -> bool:
    return not SHELL_CONTROL.search(command) and SAFE_BASH.match(command) is not None


def block(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


event = json.load(sys.stdin)
tool_name = event.get("tool_name", "")
tool_input = event.get("tool_input", {})
cwd = event.get("cwd", ".")

if isinstance(tool_input, str):
    command = tool_input
    arguments = {}
elif isinstance(tool_input, dict):
    command = next(
        (
            tool_input[key]
            for key in ("command", "cmd", "patch", "code")
            if isinstance(tool_input.get(key), str)
        ),
        "",
    )
    arguments = tool_input
else:
    command = ""
    arguments = {}

reason = (
    "Do not write Changeset fragments by hand. Run `npm run changesets:add` "
    "and follow the CLI prompts."
)

if tool_name in {"apply_patch", "Edit", "Write"}:
    targets = [match.group(1).strip() for match in PATCH_FILE.finditer(command)]
    targets.extend(
        str(arguments[key])
        for key in ("file_path", "filePath", "path", "filename", "target")
        if isinstance(arguments.get(key), str)
    )
    if any(is_changeset_fragment(target, cwd) for target in targets):
        block(reason)
elif tool_name == "Bash":
    references_fragment = FRAGMENT_PATH.search(command) is not None
    changeset_directory_write = (
        is_inside_changesets(cwd)
        and re.search(r"\.md(?:$|\W)", command, re.IGNORECASE) is not None
    )
    mentions_changeset_directory = ".changeset" in command
    if (
        references_fragment or changeset_directory_write or mentions_changeset_directory
    ) and not is_nonwriting_shell_command(command):
        block(reason)
elif tool_name in {"exec", "functions.exec"}:
    if FRAGMENT_PATH.search(command) is not None:
        if "tools.apply_patch(" in command:
            block(reason)
        elif re.search(
            r"\b(?:writeFile|writeFileSync|appendFile|appendFileSync|"
            r"write_text|write_bytes|createWriteStream)\s*\(",
            command,
        ):
            block(reason)
        else:
            embedded_commands = EMBEDDED_COMMAND.findall(command)
            if not embedded_commands or any(
                not is_nonwriting_shell_command(shell_command)
                for _, shell_command in embedded_commands
            ):
                block(reason)
