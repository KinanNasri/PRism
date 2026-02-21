const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const WHITE = "\x1b[37m";

export function banner(): void {
    const lines = [
        "",
        `${CYAN}${BOLD}  ██████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗${RESET}`,
        `${CYAN}${BOLD}  ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝${RESET}`,
        `${CYAN}${BOLD}  ██████╔╝██████╔╝███████╗██║     ██║   ██║██████╔╝█████╗  ${RESET}`,
        `${CYAN}${BOLD}  ██╔═══╝ ██╔══██╗╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝  ${RESET}`,
        `${CYAN}${BOLD}  ██║     ██║  ██║███████║╚██████╗╚██████╔╝██║     ███████╗${RESET}`,
        `${CYAN}${BOLD}  ╚═╝     ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝${RESET}`,
        "",
        `${DIM}  AI-powered PR reviews that actually help.${RESET}`,
        "",
    ];
    console.log(lines.join("\n"));
}

export function heading(text: string): void {
    console.log(`\n${CYAN}${BOLD}> ${text}${RESET}\n`);
}

export function success(text: string): void {
    console.log(`  ${GREEN}+${RESET} ${text}`);
}

export function warn(text: string): void {
    console.log(`  ${YELLOW}!${RESET} ${text}`);
}

export function error(text: string): void {
    console.log(`  ${RED}x${RESET} ${text}`);
}

export function info(text: string): void {
    console.log(`  ${DIM}${text}${RESET}`);
}

export function highlight(label: string, value: string): void {
    console.log(`  ${WHITE}${label}:${RESET} ${MAGENTA}${value}${RESET}`);
}

export function divider(): void {
    console.log(`\n${DIM}  ${"─".repeat(48)}${RESET}\n`);
}

export function nextSteps(steps: string[]): void {
    console.log(`\n${CYAN}${BOLD}  Next steps:${RESET}\n`);
    steps.forEach((step, i) => {
        console.log(`  ${BOLD}${i + 1}.${RESET} ${step}`);
    });
    console.log("");
}

export function box(title: string, lines: string[]): void {
    const maxLen = Math.max(title.length, ...lines.map((l) => l.length));
    const width = maxLen + 4;
    const top = `  ╭${"─".repeat(width)}╮`;
    const bottom = `  ╰${"─".repeat(width)}╯`;
    const titleLine = `  │  ${BOLD}${title}${RESET}${" ".repeat(width - title.length - 2)}│`;
    const separator = `  ├${"─".repeat(width)}┤`;

    console.log(top);
    console.log(titleLine);
    console.log(separator);
    lines.forEach((line) => {
        const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
        const padding = width - stripped.length - 2;
        console.log(`  │  ${line}${" ".repeat(Math.max(0, padding))}│`);
    });
    console.log(bottom);
    console.log("");
}
