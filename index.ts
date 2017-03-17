'use strict';

import * as fs from 'fs-extra';
import {Client, ClientChannel, ConnectConfig} from 'ssh2';
import {expandHomeDirectory as home} from 'util.home';
import {callSync, nil, sanitize} from 'util.toolbox';
import {Semaphore, wait} from 'util.wait';
import * as uuid from 'uuid';

const pkg = require('./package.json');

export interface IScaffoldOpts extends ConnectConfig {
	stub?: boolean;
	hostname?: string;
	privateKeyFile?: string;
	publicKeyFile?: string;
	publicKey?: string;
	timeout?: number;
}

export interface ICommandOpts {
	cwd?: string;
	delay?: number;
	group?: string;
	mode?: string;
	owner?: string;
	recursive?: boolean;
	sudo?: boolean;
	verbose?: boolean;
	shell?: string;
}

/** an instance of the Scaffold class */
export class Scaffold {

	private _debug: boolean = pkg.debug;
	private _cmds: string[] = [];
	private _config: IScaffoldOpts = null;
	private _history: string[] = [];
	private _local: boolean = false;
	private _semaphore: Semaphore = null;

	/**
	 * The constructor function for the scaffolding.  This takes a single parameter
	 * that represents the configuration required to connect to a remote host using
	 * SSH.  If the config is empty, then the commands are all executed on the
	 * local host instead.
	 * @param [opts] {IScaffoldOpts} holds SSH connection information from config.json
	 * @constructor
	 */
	constructor(opts?: IScaffoldOpts) {
		opts = Object.assign({
			stub: false,
			port: 22,
			privateKeyFile: '~/.ssh/id_rsa',
			publicKeyFile: '~/.ssh/id_rsa.pub',
			timeout: 3600
		}, opts);

		this._semaphore = new Semaphore(opts.timeout);
		this._config = opts;
		if (opts.host != null) {
			opts.privateKey = fs.readFileSync(home(opts.privateKeyFile)).toString();
			opts.publicKey = fs.readFileSync(home(opts.publicKeyFile)).toString();
		} else {
			this._local = true;
		}
	}

	/**
	 * Runs a command on a remote or local server.
	 * @param cmd {string} the command to run
	 * @param opts {object} an object that holds the parameters used to run
	 * this command.
	 *
	 *   - cwd: current working directory
	 *   - sudo: a boolean that determines if sudo should be used
	 *   - delay: how many seconds to delay after the call.
	 */
	public run(cmd: string, opts: ICommandOpts = null): Scaffold {
		opts = Object.assign({sudo: false, cwd: '', delay: 0}, opts);

		if (cmd === '' || typeof cmd === 'undefined') {
			return this;
		}

		if (opts.cwd) {
			cmd = 'cd ' + opts.cwd + ' && ' + ((opts.sudo) ? 'sudo ' : '') + cmd;
		}

		if (opts.sudo) {
			cmd = 'sudo -E ' + cmd;
		}

		this._semaphore.increment();
		this._cmds.push(cmd);

		wait(opts.delay, (err: Error) => {
			if (err) {
				console.error(err.message);
			}
		});

		return this;
	};

	/**
	 * A sugar wrapper for calling run with sudo wrapped around it.  See "run" for
	 * the list of parameters in the args object.
	 * @param cmd {string} the sudo command to execute
	 * @param opts {object} an object that holds the parameters to the sudo call.
	 */
	public sudo(cmd: string, opts: ICommandOpts = null) {
		opts = Object.assign({cwd: ''}, opts);
		opts.sudo = true;

		return this.run(cmd, opts);
	};

	/**
	 * Takes a text file and puts it on the target remote machine.
	 * @param lfile {string} the local file name to send to the remote
	 * @param rfile {string} the name of the remote file to send
	 * @param opts {object} the list of optional arguments  these include:
	 *
	 *   - mode: the file mode octet for the file being placed
	 *   - owner: the owner that should be set for this file
	 *   - group: linux group permission to set on file.
	 *
	 * @returns {Scaffold} a reference to this object for chaining.
	 */
	public put(lfile: string, rfile: string, opts: ICommandOpts = null) {
		opts = Object.assign({mode: '755', owner: 'root', group: 'root'}, opts);

		let id: string = uuid.v4();
		let cmd = `tee ${rfile} <<-'${id}'\n`;
		cmd += fs.readFileSync(lfile);
		cmd += `\n${id}`;
		this.sudo(cmd);
		this.sudo(`chown -R ${opts.owner}.${opts.group} ${rfile}`);
		this.sudo(`chmod -R ${opts.mode} ${rfile}`);

		return this;
	};

	/**
	 * Creates a directory on the remote server.
	 * @param directory {string} the directory to factory on the remote server
	 *
	 * @param opts {object} the list of optional arguments  these include:
	 *
	 *   - mode: the file mode octet for the file being placed
	 *   - owner: the owner that should be set for this file
	 *   - group: linux group permission to set on file.
	 *
	 * @returns {Scaffold} a reference to this object for chaining.
	 */
	public mkdir(directory: string, opts: ICommandOpts = null) {
		opts = Object.assign({mode: '755', owner: 'root', group: 'root'}, opts);

		this.sudo(`[ ! -d ${directory} ] && sudo mkdir -p ${directory} || echo "directory already exists"`);
		this.sudo(`chown -R ${opts.owner}.${opts.group} ${directory}`);
		this.sudo(`chmod -R ${opts.mode} ${directory}`);

		return this;
	};

	/**
	 * Copies a file from one location to the other (on the same server).  Use put
	 * to move a file from locatl to remote.  This just moves things around on the
	 * same server.
	 * @param src {string} the source file to move
	 * @param dst {string} the destination location
	 * @param [opts] {object} the optional arguments object
	 *
	 *   - recursive: {boolean} if true, use the -r flag on the copy
	 *   - sudo: {boolean} if true use sudo, otherwise regular copy
	 *
	 * @returns {Scaffold} a reference to this object for chaining.
	 */
	public copy(src: string, dst: string, opts: ICommandOpts = null) {
		opts = Object.assign({recursive: false, sudo: false}, opts);

		if (fs.existsSync(src)) {
			this.run(`cp ${(opts.recursive) ? '-r' : ''} ${src} ${dst}`, {sudo: opts.sudo});
		} else {
			console.log(`No copy.  ${src} does not exist`);
		}

		return this;
	};

	/**
	 * Starts the processing of the command queue.
	 * @param [opts] {ICommandOpts} a set of commands used to process this queue.
	 *
	 *     - verbose: {boolean} if true, then print more output, otherwise silent
	 *     - shell: {string} the shell that the command should be run against.  This
	 *       is only relevant for the local processor.   The remote processor runs
	 *       with the shell of the authenticated in user.
	 *
	 * @param [cb] {Function} a callback function that is executed when this process
	 * completes.  It will be executed on success or failure.
	 */
	public go(opts?: ICommandOpts, cb?: Function) {
		if (typeof opts === 'function') {
			cb = opts;
			opts = null;
		}

		opts = Object.assign({
			verbose: true,
			shell: '/bin/bash'
		}, opts);

		if (this._local) {
			this.runLocal(opts, cb);
		} else {
			this.runRemote(opts, cb);
		}
	}

	get local(): boolean {
		return this._local;
	}

	get history(): string[] {
		return this._history;
	}

	/**
	 * Runs the given command queue on the local host.
	 * @param opts {ICommandOpts} the options that are used to run all commands
	 * in the queue.
	 * @param cb {Function} a callback function that is executed when the
	 * remote execution finishes or has an error.
	 * @param self {Scaffold} a reference to the Scaffold instance.
	 * @returns the result of the given callback function.
	 * @private
	 */
	private runLocal(opts: ICommandOpts, cb: Function = nil, self = this) {
		let pos: number = 1;
		while (this._cmds.length > 0) {
			let cmd: string = this._cmds.shift();
			this._semaphore.decrement();

			if (opts.verbose) {
				sanitize(`Executing[${pos++}]: ${cmd}`, true);
			}

			this._history.push(cmd);

			if (!this._config.stub) {
				callSync(cmd, (err: Error) => {
					if (err) {
						return cb(err, self);
					}
				});
			}
		}

		return cb(null, self);
	}

	/**
	 * Runs the given command queue on the remote server.
	 * @param opts {ICommandOpts} the options that are used to run all commands
	 * in the queue.
	 * @param cb {Function} a callback function that is executed when the
	 * remote execution finishes or has an error.
	 * @param self {Scaffold} a reference to the Scaffold instance.
	 * @returns the result of the given callback function.
	 * @private
	 */
	private runRemote(opts: ICommandOpts, cb: Function = nil, self = this) {
		let pos = 1;

		let conn: Client = null;
		if (!self._config.stub) {
			conn = new Client();
		}

		function exec(ssh: Client, cmd: string) {
			if (opts.verbose || self._debug) {
				sanitize(`Executing[${pos++}]: ${cmd}`, true);
			}

			self._history.push(cmd);

			if (self._config.stub) {
				self._semaphore.decrement();

				if (self._cmds.length > 0) {
					exec(ssh, self._cmds.shift());
				}
			} else {
				ssh.exec(cmd, {pty: true}, (err: Error, stream) => {
					if (err) {
						return cb(err, self);
					}

					stream.on('close', (clerr: Error, signal: ClientChannel) => {
						if (clerr) {
							return cb(new Error(`command failed: ${clerr.message}, signal: ${signal}`), self);
						}
						self._semaphore.decrement();

						if (self._cmds.length > 0) {
							// recursively call run to process the next item in the
							// queue.
							exec(ssh, self._cmds.shift());
						}
					}).on('data', (data: Buffer) => {
						sanitize(data, opts.verbose);
					}).stderr.on('data', (data: Buffer) => {
						sanitize(data, opts.verbose, console.error);
					});
				});
			}
		}

		if (!self._config.stub) {
			conn.on('ready', () => {
				exec(conn, self._cmds.shift());
			}).connect(self._config);
		} else {
			exec(conn, self._cmds.shift());
		}

		this._semaphore.wait()
			.then(() => {
				if (!self._config.stub) {
					conn.end();
				}

				sanitize('End of remote processing', true);
				cb(null, self);
			})
			.catch((err: string) => {
				return cb(err, self);
			});
	}
}
