'use strict';

import test from 'ava';
import * as path from 'path';
import {Fixture} from 'util.fixture';
import {isLinux, isMac, isWin} from 'util.toolbox';
import * as uuid from 'uuid';
import {Scaffold} from '../index';
import {cleanup} from './helpers';

test.after.always.cb(t => {
	cleanup(path.basename(__filename), t);
});

test('Test the creation of a local scaffold object', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);
});

test.cb('Test the use of the local run command (stub)', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.run('ls -axpl')
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 1);
			t.is(scaffold.history[0], 'ls -axpl');
			t.end();
		});
});

test.cb('Test run with change in current working directory (stub)', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.run('ls -axpl', {cwd: '/tmp'})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 1);
			t.is(scaffold.history[0], 'cd /tmp && ls -axpl');
			t.end();
		});
});

test.cb('Test run with sudo modifier (stub)', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.run('ls -axpl', {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 1);
			t.is(scaffold.history[0], 'sudo -E ls -axpl');
			t.end();
		});
});

test.cb('Chain three run commands together (stub)', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.run('ls -axpl')
		.run('pwd')
		.run('ls /usr/bin', {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 3);
			t.is(scaffold.history[0], 'ls -axpl');
			t.is(scaffold.history[1], 'pwd');
			t.is(scaffold.history[2], 'sudo -E ls /usr/bin');
			t.end();
		});
});

test.cb('Test an empty run call (stub)', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.run('')
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 0);
			t.end();
		});
});

test.cb('Test the sudo direct call function', t => {
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.sudo('env | sort')
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 1);
			t.is(scaffold.history[0], 'sudo -E env | sort');
			t.end();
		});
});

test.cb('Test the put command direct function', t => {
	let fixture = new Fixture('put-file');
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	scaffold
		.put(path.join(fixture.dir, 'sample.txt'), path.join(fixture.dir, 'newfile.txt'))
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 3);
			t.true(scaffold.history[0].startsWith(`sudo -E tee ${fixture.dir}`));
			t.true(scaffold.history[1].startsWith(`sudo -E chown -R root.root ${fixture.dir}`));
			t.true(scaffold.history[2].startsWith(`sudo -E chmod -R 755 ${fixture.dir}`));
			t.end();
		});
});

test.cb('Test the mkdir command direct function', t => {
	let fixture = new Fixture();
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	let dir: string = path.join(fixture.dir, 'newdir');
	scaffold
		.mkdir(dir)
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 3);
			t.true(scaffold.history[0].startsWith(`sudo -E [ ! -d ${dir} ] && sudo mkdir -p ${dir}`));
			t.true(scaffold.history[1].startsWith(`sudo -E chown -R root.root ${fixture.dir}`));
			t.true(scaffold.history[2].startsWith(`sudo -E chmod -R 755 ${fixture.dir}`));
			t.end();
		});
});

test.cb('Test the copy command direct function', t => {
	let fixture = new Fixture('put-file');
	let scaffold = new Scaffold({
		stub: true
	});

	t.truthy(scaffold);
	t.true(scaffold.local);

	let src: string = path.join(fixture.dir, 'sample.txt');
	let dst: string = path.join(fixture.dir, 'newfile.txt');

	scaffold
		.copy(src, dst)
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 1);
			t.is(scaffold.history[0], `cp ${src} ${dst}`);
			t.end();
		});
});

test.cb('Test the copy command with invalid source file (negative test)', t => {
	let fixture = new Fixture('put-file');
	let scaffold = new Scaffold();

	t.truthy(scaffold);
	t.true(scaffold.local);

	let src: string = path.join(fixture.dir, uuid.v4());
	let dst: string = path.join(fixture.dir, 'newfile.txt');

	scaffold
		.copy(src, dst)
		.go({verbose: true}, (err: Error) => {
			console.log(err.message);
			if (err) {
				t.pass(err.message);
				return t.end();
			}

			t.fail(`Shouldn't get here`);
		});
});

test.cb('Use a stubbed version to show remote execution (stub)', t => {
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

	t.truthy(scaffold);
	t.true(!scaffold.local);

	scaffold
		.run('uname')
		.run('env | sort')
		.run('ls /usr/bin', {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				t.fail(err.message);
				return t.end();
			}

			t.true(obj instanceof Scaffold);
			t.is(scaffold.history.length, 3);
			t.is(scaffold.history[0], 'uname');
			t.is(scaffold.history[1], 'env | sort');
			t.is(scaffold.history[2], 'sudo -E ls /usr/bin');
			t.end();
		});
});

test.cb('Run a local queue of commands (silent)', t => {
	let scaffold = new Scaffold();

	t.truthy(scaffold);
	t.true(scaffold.local);

	if (isLinux || isMac) {
		scaffold
			.run('ls -axpl /usr/local')
			.run('ls -axpl /usr/local/lib')
			.run('ls -axpl /tmp')
			.go({verbose: false}, (err: Error, inst: Scaffold) => {
				if (err) {
					t.fail();
					return t.end();
				}

				t.is(inst, scaffold);
				t.end();
			});
	} else if (isWin) {
		scaffold
			.run('dir C:\\Windows')
			.run('dir C:\\Windows\\System')
			.run('dir C:\\Windows\\System32')
			.go({verbose: false}, (err: Error, inst: Scaffold) => {
				if (err) {
					t.fail();
					return t.end();
				}

				t.is(inst, scaffold);
				t.end();
			});
	}
});

test.cb('Run a test of go() function with no options', t => {
	let scaffold = new Scaffold();

	t.truthy(scaffold);
	t.true(scaffold.local);

	if (isLinux || isMac) {
		scaffold
			.run('ls -axpl /usr/local')
			.go((err: Error, inst: Scaffold) => {
				if (err) {
					t.fail();
					return t.end();
				}

				t.is(inst, scaffold);
				t.end();
			});
	} else if (isWin) {
		scaffold
			.run('dir C:\\Windows')
			.go((err: Error, inst: Scaffold) => {
				if (err) {
					t.fail();
					return t.end();
				}

				t.is(inst, scaffold);
				t.end();
			});
	}
});
