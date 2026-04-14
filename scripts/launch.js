/**
 * Launches the Electron app with ELECTRON_RUN_AS_NODE cleared.
 * Required when running from environments (like VS Code / Claude Code IDE)
 * that set ELECTRON_RUN_AS_NODE=1, which strips the Electron API.
 */
const { spawn } = require('child_process');
const electronBin = require('electron'); // npm package returns binary path

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBin, ['.'], { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code ?? 0));
