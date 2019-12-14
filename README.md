# util.scaffold

> A library to simplify SSH interactions with a remote server.  It can be used to run commands, change config, create files, etc.

[![build](https://github.com/jmquigley/util.scaffold/workflows/build/badge.svg)](https://github.com/jmquigley/util.scaffold/actions)
[![analysis](https://img.shields.io/badge/analysis-tslint-9cf.svg)](https://palantir.github.io/tslint/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![testing](https://img.shields.io/badge/testing-jest-blue.svg)](https://facebook.github.io/jest/)
[![NPM](https://img.shields.io/npm/v/util.scaffold.svg)](https://www.npmjs.com/package/util.scaffold)

This module contains functions for simplifying SSH interactions with the remote production server.  It can be used to run commands, change config, create files, etc.

Each of the calls to run, sudo, etc, are sent to a command list queue.  Once the commands are queued up, then the `go` function is called to process the commands in order.  This class is used to group together dependent functions.  Each grouping of commands should be a separate instantiation of the Scaffold class.  e.g.

    let scaffold = new Scaffold(config.ssh);

    scaffold
        .run('uname -a')
        .sudo('env | sort')
        .go();

Note that coverage is difficult with this module.  It requires a host that can be used connected to via SSH and that the user has full control over that host.


## Installation

This module uses [yarn](https://yarnpkg.com/en/) to manage dependencies and run scripts for development.

To install as an application dependency:
```
$ yarn add util.scaffold
```

To build the app and run all tests:
```
$ yarn run all
```


## Usages
To connect to a remote server and execute a set of commands:

```
const Scaffold = require('util.scaffold').Scaffold;

let config = {
    "hostname": "example.com",
    "host": "192.168.1.42",
    "port": 22,
    "username": "centos",
    "privateKeyFile": "~/.ssh/id_rsa",
    "publicKeyFile": "~/.ssh/id_rsa.pub"
};

new Scaffold(config)
    .run('uname -a')
    .sudo('env | sort')
    .mkdir('/var/log/myapp', {mode: '700', owner: 'root', group: 'docker'})
    .put('/tmp/file1.txt', '/tmp/file2.txt')
    .go((err) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log('Done.');
    })
```

An instance of the [Scaffold](docs/index.md) class is created.  Methods can be chained to this instance to queue commands.  The first command above runs the `uname` command on the remote server.  It runs it as the `centos` user.  The second command dumps a sorted list of environment variables using sudo.  This assumes that the SSH user `centos` has sudo permissions (or this command will fail).  The third chained command creates a directory named `/var/log/myapp` and sets the permissions/ownership of the directory.  The fourth command takes a file on the local machine and moves it to the remote machine.  It works with text files only.  All four of these commands are added to a queue.  Execution starts when the `go` command is called.  It processes each command in order.  When it finishes a callback is executed.  The callback uses the ["error first callback" convention](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/) in node.

## API
The module is composed of one class named [Scaffold](docs/index.md).  It has the following public functions:

- [copy](docs/index.md#Scaffold+copy) - copies a file on the remote machine from one location to another on the remote machine.
- [go](docs/index.md#Scaffold+go) - starts the processing of the command queue.
- [mkdir](docs/index.md#Scaffold+mkdir) - creates a directory on the remote host.
- [put](docs/index.md#Scaffold+put) - takes a file from the local host and puts it on the remote host.
- [run](docs/index.md#Scaffold+run) - runs a command on the remote host.
- [sudo](docs/index.md#Scaffold+sudo) - runs a command on the remote host using sudo.
