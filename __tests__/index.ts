"use strict";

import * as path from "path";
import {cleanup, Fixture} from "util.fixture";
import {isLinux, isMac, isWin} from "util.toolbox";
import * as uuid from "uuid";
import {Scaffold} from "../index";

afterAll((done) => {
	cleanup({done, message: path.basename(__filename)});
});

test("Test the creation of a local scaffold object", () => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);
});

test("Test the use of the local run command (stub)", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.run("ls -axpl")
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(1);
			expect(scaffold.history[0]).toBe("ls -axpl");
			done();
		});
});

test("Test run with change in current working directory (stub)", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.run("ls -axpl", {cwd: "/tmp"})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done;
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(1);
			expect(scaffold.history[0]).toBe("cd /tmp && ls -axpl");
			done();
		});
});

test("Test run with sudo modifier (stub)", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.run("ls -axpl", {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(1);
			expect(scaffold.history[0]).toBe("sudo -E ls -axpl");
			done();
		});
});

test("Chain three run commands together (stub)", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.run("ls -axpl")
		.run("pwd")
		.run("ls /usr/bin", {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(3);
			expect(scaffold.history[0]).toBe("ls -axpl");
			expect(scaffold.history[1]).toBe("pwd");
			expect(scaffold.history[2]).toBe("sudo -E ls /usr/bin");
			done();
		});
});

test("Test an empty run call (stub)", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold.run("").go({verbose: true}, (err: Error, obj: Scaffold) => {
		if (err) {
			throw new Error(err.message);
			return done();
		}

		expect(obj instanceof Scaffold).toBe(true);
		expect(scaffold.history.length).toBe(0);
		done();
	});
});

test("Test the sudo direct call function", (done) => {
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.sudo("env | sort")
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(1);
			expect(scaffold.history[0]).toBe("sudo -E env | sort");
			done();
		});
});

test("Test the put command direct function", (done) => {
	const fixture = new Fixture("put-file");
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	scaffold
		.put(
			path.join(fixture.dir, "sample.txt"),
			path.join(fixture.dir, "newfile.txt")
		)
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(3);
			expect(
				scaffold.history[0].startsWith(`sudo -E tee ${fixture.dir}`)
			).toBe(true);
			expect(
				scaffold.history[1].startsWith(
					`sudo -E chown -R root.root ${fixture.dir}`
				)
			).toBe(true);
			expect(
				scaffold.history[2].startsWith(
					`sudo -E chmod -R 755 ${fixture.dir}`
				)
			).toBe(true);
			done();
		});
});

test("Test the mkdir command direct function", (done) => {
	const fixture = new Fixture();
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	const dir: string = path.join(fixture.dir, "newdir");
	scaffold.mkdir(dir).go({verbose: true}, (err: Error, obj: Scaffold) => {
		if (err) {
			throw new Error(err.message);
			return done();
		}

		expect(obj instanceof Scaffold).toBe(true);
		expect(scaffold.history.length).toBe(3);
		expect(
			scaffold.history[0].startsWith(
				`sudo -E [ ! -d ${dir} ] && sudo mkdir -p ${dir}`
			)
		).toBe(true);
		expect(
			scaffold.history[1].startsWith(
				`sudo -E chown -R root.root ${fixture.dir}`
			)
		).toBe(true);
		expect(
			scaffold.history[2].startsWith(
				`sudo -E chmod -R 755 ${fixture.dir}`
			)
		).toBe(true);
		done();
	});
});

test("Test the copy command direct function", (done) => {
	const fixture = new Fixture("put-file");
	const scaffold = new Scaffold({
		stub: true
	});

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	const src: string = path.join(fixture.dir, "sample.txt");
	const dst: string = path.join(fixture.dir, "newfile.txt");

	scaffold.copy(src, dst).go({verbose: true}, (err: Error, obj: Scaffold) => {
		if (err) {
			throw new Error(err.message);
			return done();
		}

		expect(obj instanceof Scaffold).toBe(true);
		expect(scaffold.history.length).toBe(1);
		expect(scaffold.history[0]).toBe(`cp ${src} ${dst}`);
		done();
	});
});

test("Test the copy command with invalid source file (negative test)", (done) => {
	const fixture = new Fixture("put-file");
	const scaffold = new Scaffold();

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	const src: string = path.join(fixture.dir, uuid.v4());
	const dst: string = path.join(fixture.dir, "newfile.txt");

	scaffold.copy(src, dst).go({verbose: true}, (err: Error) => {
		console.log(err.message);
		if (err) {
			expect(err.message).toBeTruthy();
			return done();
		}

		throw new Error(`Shouldn't get here`);
	});
});

test("Use a stubbed version to show remote execution (stub)", (done) => {
	const fixture = new Fixture("fake-keys");
	const scaffold = new Scaffold({
		stub: true,
		hostname: "example.com",
		host: "127.0.0.1",
		username: "user",
		password: "password",
		privateKeyFile: path.join(fixture.dir, "id_rsa"),
		publicKeyFile: path.join(fixture.dir, "id_rsa.pub")
	});

	expect(scaffold).toBeDefined();
	expect(!scaffold.local).toBe(true);

	scaffold
		.run("uname")
		.run("env | sort")
		.run("ls /usr/bin", {sudo: true})
		.go({verbose: true}, (err: Error, obj: Scaffold) => {
			if (err) {
				throw new Error(err.message);
				return done();
			}

			expect(obj instanceof Scaffold).toBe(true);
			expect(scaffold.history.length).toBe(3);
			expect(scaffold.history[0]).toBe("uname");
			expect(scaffold.history[1]).toBe("env | sort");
			expect(scaffold.history[2]).toBe("sudo -E ls /usr/bin");
			done();
		});
});

test("Run a local queue of commands (silent)", (done) => {
	const scaffold = new Scaffold();

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	if (isLinux || isMac) {
		scaffold
			.run("ls -axpl /usr/local")
			.run("ls -axpl /usr/local/lib")
			.run("ls -axpl /tmp")
			.go({verbose: false}, (err: Error, inst: Scaffold) => {
				if (err) {
					throw new Error(err);
					return done();
				}

				expect(inst).toBe(scaffold);
				done();
			});
	} else if (isWin) {
		scaffold
			.run("dir C:\\Windows")
			.run("dir C:\\Windows\\System")
			.run("dir C:\\Windows\\System32")
			.go({verbose: false}, (err: Error, inst: Scaffold) => {
				if (err) {
					throw new Error(err);
					return done();
				}

				expect(inst).toBe(scaffold);
				done();
			});
	}
});

test("Run a test of go() function with no options", (done) => {
	const scaffold = new Scaffold();

	expect(scaffold).toBeDefined();
	expect(scaffold.local).toBe(true);

	if (isLinux || isMac) {
		scaffold.run("ls -axpl /usr/local").go((err: Error, inst: Scaffold) => {
			if (err) {
				throw new Error(err);
				return done();
			}

			expect(inst).toBe(scaffold);
			done();
		});
	} else if (isWin) {
		scaffold.run("dir C:\\Windows").go((err: Error, inst: Scaffold) => {
			if (err) {
				throw new Error(err);
				return done();
			}

			expect(inst).toBe(scaffold);
			done();
		});
	}
});
