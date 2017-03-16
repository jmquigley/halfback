'use strict';

import * as assert from 'assert';
import * as path from 'path';
import {Fixture} from 'util.fixture';
import {isLinux, isMac, isWin} from 'util.toolbox';
import {Scaffold} from '../index';

describe('Testing Scaffolding', () => {

	it('Test the creation of a local scaffold object', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);
	});

	it('Test the use of the local run command (stub)', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl')
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'ls -axpl');
	});

	it('Test run with change in current working directory (stub)', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl', {cwd: '/tmp'})
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'cd /tmp && ls -axpl');
	});

	it('Test run with sudo modifier (stub)', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl', {sudo: true})
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'sudo -E ls -axpl');
	});

	it('Chain three run commands together (stub)', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl')
			.run('pwd')
			.run('ls /usr/bin', {sudo: true})
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0] === 'ls -axpl');
		assert(scaffold.history[1] === 'pwd');
		assert(scaffold.history[2] === 'sudo -E ls /usr/bin');
	});

	it('Test an empty run call (stub)', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('')
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 0);
	});

	it('Test the sudo direct call function', (done) => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.sudo('env | sort')
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'sudo -E env | sort');
	});

	it('Test the put command direct function', (done) => {
		let fixture = new Fixture('put-file');
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.put(path.join(fixture.dir, 'sample.txt'), path.join(fixture.dir, 'newfile.txt'))
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0].startsWith(`sudo -E tee ${fixture.dir}`));
		assert(scaffold.history[1].startsWith(`sudo -E chown -R root.root ${fixture.dir}`));
		assert(scaffold.history[2].startsWith(`sudo -E chmod -R 755 ${fixture.dir}`));
	});

	it('Test the mkdir command direct function', (done) => {
		let fixture = new Fixture();
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		let dir: string = path.join(fixture.dir, 'newdir');
		scaffold
			.mkdir(dir)
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0].startsWith(`sudo -E [ ! -d ${dir} ] && sudo mkdir -p ${dir}`));
		assert(scaffold.history[1].startsWith(`sudo -E chown -R root.root ${fixture.dir}`));
		assert(scaffold.history[2].startsWith(`sudo -E chmod -R 755 ${fixture.dir}`));
	});

	it('Test the copy command direct function', (done) => {
		let fixture = new Fixture('put-file');
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		let src: string = path.join(fixture.dir, 'sample.txt');
		let dst: string = path.join(fixture.dir, 'newfile.txt');

		scaffold
			.copy(src, dst)
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
				done();
			});

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === `cp ${src} ${dst}`);
	});

	it('Use a stubbed version to show remote execution (stub)', () => {
		let fixture = new Fixture('fake-keys');
		let scaffold = new Scaffold({
			stub: true,
			hostname: 'example.com',
			host: '127.0.0.1',
			username: 'user',
			password: 'password',
			privateKeyFile: path.join(fixture.dir, 'id_rsa'),
			publicKeyFile: path.join(fixture.dir, 'id_rsa.pub')
		});

		assert(scaffold);
		assert(!scaffold.local);

		scaffold
			.run('uname')
			.run('env | sort')
			.run('ls /usr/bin', {sudo: true})
			.go({verbose: true}, (err: Error, obj: Scaffold) => {
				if (err) {
					assert(false, err.message);
				}

				assert(obj instanceof Scaffold);
			});

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0] === 'uname');
		assert(scaffold.history[1] === 'env | sort');
		assert(scaffold.history[2] === 'sudo -E ls /usr/bin');
	});

	it('Run a local queue of commands (silent)', (done) => {
		let scaffold = new Scaffold();

		assert(scaffold);
		assert(scaffold.local);

		if (isLinux || isMac) {
			scaffold
				.run('ls -axpl /usr/local')
				.run('ls -axpl /usr/local/lib')
				.run('ls -axpl /tmp')
				.go({verbose: false}, (err: Error, inst: Scaffold) => {
					if (err) {
						assert(false);
					}
					assert(inst === scaffold);
				});
		} else if (isWin) {
			scaffold
				.run('dir C:\Windows')
				.run('dir C:\Windows\System')
				.run('dir C:\Windows\System32')
				.go({verbose: false}, (err: Error, inst: Scaffold) => {
					if (err) {
						assert(false);
					}

					assert(inst === scaffold);
				});
		}

		done();
	});
});
