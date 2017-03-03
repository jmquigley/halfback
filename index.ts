/**
 * This module contains functions for simplifying SSH interactions with the
 * remote production server.  It can be used to run commands, change config,
 * create files, etc.
 *
 * Each of the calls to run, sudo, etc, are sent to a command list queue.  Once
 * the commands are queued up, then the `go` function is called to process
 * the commands in order.  This class is used to group together dependent
 * functions.  It will run async.  Each grouping of commands should be a
 * separate instantiation of the Scaffold class.
 *
 * e.g.
 *
 *     let scaffold = new Scaffold(config.ssh);
 *
 *     scaffold.run('uname -a')
 *         .sudo('env | sort')
 *         .go();
 *
 * @module scaffold
 */

'use strict';

import * as proc from 'child_process';
// import {Client} from 'ssh2';
import * as fs from 'fs-extra';
import {rstrip} from 'util.rstrip';
import {wait} from 'util.wait';
import * as uuid from 'uuid';

const home = require('expand-home-dir');

export interface IScaffoldOpts {
	stub?: boolean;
	debug?: boolean;
	hostname?: string;
	host?: string;
	port?: number;
	username?: string;
	privateKeyFile?: string;
	privateKey?: string;
	publicKeyFile?: string;
	publicKey?: string;
}

export interface ICommandOpts {
	cwd?: string;
	delay?: number;
	group?: string;
	mode?: string;
	owner?: string;
	quiet?: boolean;
	recursive?: boolean;
	sudo?: boolean;
	verbose?: boolean;
}

/** an instance of the Scaffold class */
export class Scaffold {

	private _cmds: string[] = [];
	private _config: IScaffoldOpts = null;
	private _history: string[] = [];
	private _local: boolean = false;
	private _output: string = '';

	/**
	 * The constructor function for the scaffolding.  This takes a single parameter
	 * that represents the configuration required to connect to a remote host using
	 * SSH.  If the config is empty, then the commands are all executed on the
	 * local host instead.
	 * @param opts {IScaffoldOpts} holds SSH connection information from config.json
	 * @constructor
	 */
	constructor(opts?: IScaffoldOpts) {
		opts = Object.assign({
			stub: false,
			debug: false,
			port: 22,
			privateKeyFile: '~/.ssh/id_rsa',
			publicKeyFle: '~/.ssh/id_rsa.pub'
		}, opts);

		this._config = opts;
		this._local = false;
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

		this._cmds.push(cmd);

		wait(opts.delay)
			.catch((err: string) => {
				console.error(err);
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
		let cmd = `sudo -E tee ${rfile} <<-'${id}'\n`;
		cmd += fs.readFileSync(lfile);
		cmd += '\n${id}';
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
			this.sanitize(`No copy.  ${src} does not exist`);
		}

		return this;
	};

	public go(opts?: ICommandOpts, cb?: Function) {
		opts = Object.assign({
			verbose: false
		}, opts);

		if (this._local) {
			this.runLocal(opts);
		} else {
			this.runRemote(opts);
		}

		if (cb != null && typeof cb === 'function') {
			cb();
		}
	}

	get local(): boolean {
		return this._local;
	}

	get history(): string[] {
		return this._history;
	}

	get output(): string {
		return this._output;
	}

	private runLocal(opts: ICommandOpts) {
		let pos: number = 1;
		while (this._cmds.length > 0) {
			let cmd: string = this._cmds.shift();

			if (opts.verbose || this._config.debug) {
				this.sanitize(`Executing[${pos++}]: ${cmd}`);
			}

			this._history.push(cmd);

			let ret: string = '';
			if (!this._config.stub) {
				ret = proc.execSync(cmd, {stdio: [0, 1, 2]}).toString();
			}

			if (!opts.quiet && ret !== null && ret.length > 0) {
				this.sanitize(ret);
			}
		}

		console.log('');
	}

	private runRemote(opts: ICommandOpts) {
		console.log(opts);
		// opts = Object.assign({verbose: true, quiet: false}, opts);
		// let idx = 0;
		// let conn = new Client();
		// let self = this;
		// let out = '';
		//
		// function exec(conn: Client, cmd: string) {
		// 	if (opts.verbose) {
		// 		this.sanitize(`Executing[${idx}]: ${cmd}`);
		// 	}
		//
		// 	conn.exec(cmd, {pty: true}, (err: Error, stream) => {
		// 		if (err) {
		// 			throw err;
		// 		}
		//
		// 		stream.on('close', (code, signal) => {
		// 			if (code !== 0 && typeof code !== 'undefined') {
		// 				throw new Error(`command failed: ${code}, signal: ${signal}`);
		// 			}
		//
		// 			idx++;
		//
		// 			if (idx >= self._cmds.length) {
		// 				conn.end();
		//
		// 				// reset the command array so it can be used again.
		// 				self._cmds.length = 0;
		//
		// 				if (done && typeof done === 'function') {
		// 					done(out);
		// 				}
		// 			} else {
		// 				// recursively call run to process the next item in the
		// 				// queue.
		// 				exec(conn, self._cmds[idx]);
		// 			}
		// 		}).on('data', (data) => {
		// 			if (!opts.quiet) {
		// 				this.sanitize(data);
		// 				out += data.toString();
		// 			}
		// 		}).stderr.on('data', (data) => {
		// 			tools.output(data);
		// 			out += data.toString();
		// 		});
		// 	});
		// }
		//
		// conn.on('ready', function () {
		// 	exec(conn, self._cmds[idx]);
		// }).connect(this._config);
	}

	/**
	 * Takes a data buffer of output bytes, converts it to a string and then splits
	 * it on newlines for output to the terminal.
	 * @param buffer {string} the output bytes to convert and print to log.
	 */
	private sanitize(buffer: string) {
		let lines = rstrip(buffer).split(/\r?\n|\r/);

		lines.forEach((line) => {
			console.log(rstrip(line.toString()));

			if (this._config.debug) {
				this._output += line;
			}
		});
	}
}
