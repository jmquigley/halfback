'use strict';

import * as path from 'path';
import * as assert from 'assert';
import {Fixture} from 'util.fixture';
import {Scaffold} from '../index';

describe('Testing Scaffolding', () => {
	it('Test the creation of a local scaffold object', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);
	});

	it('Test the use of the local run command (stub)', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl')
			.go();

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'ls -axpl');
	});

	it('Test run with change in current working directory (stub)', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl', {cwd: '/tmp'})
			.go();

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'cd /tmp && ls -axpl');
	});

	it('Test run with sudo modifier (stub)', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl', {sudo: true})
			.go();

		assert(scaffold.history.length === 1);
		assert(scaffold.history[0] === 'sudo -E ls -axpl');
	});

	it('Chain three run commands together (stub)', () => {
		let scaffold = new Scaffold({
			stub: true
		});

		assert(scaffold);
		assert(scaffold.local);

		scaffold
			.run('ls -axpl')
			.run('pwd')
			.run('ls /usr/bin', {sudo: true})
			.go();

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0] === 'ls -axpl');
		assert(scaffold.history[1] === 'pwd');
		assert(scaffold.history[2] === 'sudo -E ls /usr/bin');
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
		}, true);

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

				console.log(`OUTPUT:\n${scaffold.output}`);
				assert(obj instanceof Scaffold);
			});

		assert(scaffold.history.length === 3);
		assert(scaffold.history[0] === 'uname');
		assert(scaffold.history[1] === 'env | sort');
		assert(scaffold.history[2] === 'sudo -E ls /usr/bin');
	})
});
