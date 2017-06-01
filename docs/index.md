<a name="Scaffold"></a>

## Scaffold
an instance of the Scaffold class

**Kind**: global class  

* [Scaffold](#Scaffold)
    * [new Scaffold([opts])](#new_Scaffold_new)
    * [.run(cmd, opts)](#Scaffold+run)
    * [.sudo(cmd, opts)](#Scaffold+sudo)
    * [.put(lfile, rfile, opts)](#Scaffold+put) ⇒ [<code>Scaffold</code>](#Scaffold)
    * [.mkdir(directory, opts)](#Scaffold+mkdir) ⇒ [<code>Scaffold</code>](#Scaffold)
    * [.copy(src, dst, [opts])](#Scaffold+copy) ⇒ [<code>Scaffold</code>](#Scaffold)
    * [.go([opts], [cb])](#Scaffold+go)

<a name="new_Scaffold_new"></a>

### new Scaffold([opts])
The constructor function for the scaffolding.  This takes a single parameter
that represents the configuration required to connect to a remote host using
SSH.  If the config is empty, then the commands are all executed on the
local host instead.


| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>IScaffoldOpts</code> | holds SSH connection information from config.json |

<a name="Scaffold+run"></a>

### scaffold.run(cmd, opts)
Runs a command on a remote or local server.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cmd | <code>string</code> |  | the command to run |
| opts | <code>object</code> | <code></code> | an object that holds the parameters used to run this command.   - cwd: current working directory   - sudo: a boolean that determines if sudo should be used   - delay: how many seconds to delay after the call. |

<a name="Scaffold+sudo"></a>

### scaffold.sudo(cmd, opts)
A sugar wrapper for calling run with sudo wrapped around it.  See "run" for
the list of parameters in the args object.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cmd | <code>string</code> |  | the sudo command to execute |
| opts | <code>object</code> | <code></code> | an object that holds the parameters to the sudo call. |

<a name="Scaffold+put"></a>

### scaffold.put(lfile, rfile, opts) ⇒ [<code>Scaffold</code>](#Scaffold)
Takes a text file and puts it on the target remote machine.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  
**Returns**: [<code>Scaffold</code>](#Scaffold) - a reference to this object for chaining.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| lfile | <code>string</code> |  | the local file name to send to the remote |
| rfile | <code>string</code> |  | the name of the remote file to send |
| opts | <code>object</code> | <code></code> | the list of optional arguments  these include:   - mode: the file mode octet for the file being placed   - owner: the owner that should be set for this file   - group: linux group permission to set on file. |

<a name="Scaffold+mkdir"></a>

### scaffold.mkdir(directory, opts) ⇒ [<code>Scaffold</code>](#Scaffold)
Creates a directory on the remote server.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  
**Returns**: [<code>Scaffold</code>](#Scaffold) - a reference to this object for chaining.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| directory | <code>string</code> |  | the directory to factory on the remote server |
| opts | <code>object</code> | <code></code> | the list of optional arguments  these include:   - mode: the file mode octet for the file being placed   - owner: the owner that should be set for this file   - group: linux group permission to set on file. |

<a name="Scaffold+copy"></a>

### scaffold.copy(src, dst, [opts]) ⇒ [<code>Scaffold</code>](#Scaffold)
Copies a file from one location to the other (on the same server).  Use put
to move a file from locatl to remote.  This just moves things around on the
same server.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  
**Returns**: [<code>Scaffold</code>](#Scaffold) - a reference to this object for chaining.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| src | <code>string</code> |  | the source file to move |
| dst | <code>string</code> |  | the destination location |
| [opts] | <code>object</code> | <code></code> | the optional arguments object   - recursive: {boolean} if true, use the -r flag on the copy   - sudo: {boolean} if true use sudo, otherwise regular copy |

<a name="Scaffold+go"></a>

### scaffold.go([opts], [cb])
Starts the processing of the command queue.

**Kind**: instance method of [<code>Scaffold</code>](#Scaffold)  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>ICommandOpts</code> | a set of commands used to process this queue.     - verbose: {boolean} if true, then print more output, otherwise silent     - shell: {string} the shell that the command should be run against.  This       is only relevant for the local processor.   The remote processor runs       with the shell of the authenticated in user. |
| [cb] | <code>function</code> | a callback function that is executed when this process completes.  It will be executed on success or failure. |

