var assign       = require('object-assign');
var EventEmitter = require('events').EventEmitter;
var JSZip        = require('jszip');
var manta        = require('dota2-manta-config-engine');
var platform     = require('platform');

var actions    = require('./actions');
var constants  = require('./constants');
var dispatcher = require('./dispatcher');

// load defaults
var defaultKeyboardLayout = require('./keyboard-layouts/en-us.json');
var defaultPreset         = require('../../node_modules/dota2-manta-config-engine/presets/default.json');

// load presets & extensions
var chatwheelList = require('../../build/chatwheels.json');
var cycleList     = require('../../build/cycles.json');
var layoutList    = require('../../build/layouts.json');
var presetList    = require('../../build/presets.json');

var _state = {};

var store = assign({}, EventEmitter.prototype, {
	emitChange: function () {
		localStorage.preset = JSON.stringify(_state.preset);
		this.emit(constants.CHANGE);
	},
	addChangeListener: function (callback) {
		this.on(constants.CHANGE, callback);
	},
	removeChangeListener: function (callback) {
		this.removeListener(constants.CHANGE, callback);
	},
	getState: function () {
		return _state;
	},
	purge: function () {
		_state = {
			currentLayout: 0,
			changer: {
				key: '',
				view: -1,
				data: [],
				mode: ''
			},
			dialog: {
				confirmDelete: {
					child: '',
					type: false,
					id: false
				},
				error: {
					description: ''
				}
			},
			presets: presetList,
			chatwheels: chatwheelList,
			cycles: cycleList,
			layouts: layoutList,
			keyboardLayout: defaultKeyboardLayout
		};
		if (localStorage.preset) {
			_state.preset = manta.update(JSON.parse(localStorage.preset));
		} else {
			_state.preset = defaultPreset;
		}
		// ensure async
		setTimeout(function () {
			if (_state.preset.settings.engine.keyboardLayout !== defaultKeyboardLayout.language) {
				actions.loadKeyboardLayout();
			}
		}, 0);
		store.emitChange();
	}
});

dispatcher.register(function (action) {
	console.log('store', action);
	switch (action.type) {

		// load

		case constants.LOAD_CYCLE:
			$.getJSON('cycles/' + action.id + '.json', function (data) {
				_state.preset.cycles.push(data.actions);
				location.href = '#/cycles';
				store.emitChange();
			});
		break;

		case constants.LOAD_CHATWHEEL:
			$.getJSON('chatwheels/' + action.id + '.json', function (data) {
				_state.preset.chatwheels.push(data.phrases);
				location.href = '#/chatwheels';
				store.emitChange();
			});
		break;

		case constants.LOAD_KEYBOARD_LAYOUT:
			$.getJSON('keyboard-layouts/' + _state.preset.settings.engine.keyboardLayout.toLowerCase() + '.json', function (keyboardLayout) {
				_state.keyboardLayout = keyboardLayout;
				store.emitChange();
			});
		break;

		case constants.LOAD_PRESET:
			$.getJSON('presets/' + action.id + '.json', function (data) {
				_state.preset = data;
				location.href = '#/layouts';
				actions.loadKeyboardLayout();
				store.emitChange();
			});
		break;

		// keybinding-changer

		case constants.KEYBINDING_CHANGER_OPEN:
			_state.changer = {mode: 'bind', data: [], key: action.id, view: -1};
			store.emitChange();
			$('#bind-changer').modal('show');
		break;

		case constants.KEYBINDING_CHANGER_SET_VIEW:
			_state.changer.view = action.view;
			_state.changer.data = action.data;
			store.emitChange();
		break;

		case constants.KEYBINDING_CHANGER_SET_DATA:
			_state.changer.data[action.index] = action.data;
			store.emitChange();
		break;

		case constants.KEYBINDING_CHANGER_SAVE:
			if (action.options === false) {
				delete _state.preset.layouts[_state.currentLayout].keybinds[_state.changer.key];
			} else {
				// handle bind and cycle mode
				if (_state.changer.mode !== 'cycle') {
					_state.preset.layouts[_state.currentLayout].keybinds[_state.changer.key] = action.options;
				} else {
					_state.preset.cycles[_state.changer.key].push(action.options);
				}
			}
			store.emitChange();
			$('#bind-changer').modal('hide');
		break;

		case constants.KEYBINDING_CHANGER_CLOSE:
			$('#bind-changer').modal('hide');
		break;

		case constants.KEYBINDING_CHANGER_RESET:
			_state.changer.view = -1;
			_state.changer.data = [];
			store.emitChange();
		break;

		// error-dialog

		case constants.ERROR_DIALOG_CLOSE:
			$('#error-dialog').modal('hide');
		break;

		case constants.ERROR_DIALOG_OPEN:
			_state.dialog.error.description = action.description;
			store.emitChange();
			$('#error-dialog').modal('show');
		break;

		// preset

		case constants.PRESET_EXPORT:
			var blob = new Blob([JSON.stringify(_state.preset, null, '\t')], {type: 'text/json;charset=utf-8'});
			saveAs(blob, 'preset.json');
		break;

		case constants.PRESET_IMPORT:
			$('#file-input')[0].click();
		break;

		case constants.PRESET_IMPORT_FILE:
			var reader = new FileReader();
			reader.onload = function (e) {
				_state.preset = JSON.parse(reader.result);
				location.href = '#/editor';
				actions.loadKeyboardLayout();
				store.emitChange();
			};
			reader.readAsText($('#file-input')[0].files[0]);
		break;

		case constants.PRESET_CHANGE_DESCRIPTION:
			_state.preset.description = action.value;
			store.emitChange();
		break;

		case constants.PRESET_CHANGE_TITLE:
			_state.preset.title = action.value;
			store.emitChange();
		break;

		// basic

		case constants.DOWNLOAD:
			var options = {};
			if (platform.os.family.toLowerCase().indexOf('windows') !== -1) {
				options.CRLF = true;
				console.log('needs CRLF');
			}
			manta.compile(_state.preset, options, function (err, data) {
				console.log(err, data);
				var zip = new JSZip();
				for (var i in data) {
					zip.file(i, data[i]);
				}
				zip.file('preset.json', JSON.stringify(_state.preset, null, '\t'));
				var content = zip.generate({type:"blob"});
				saveAs(content, "manta-config.zip");
			});
		break;

		// cycle

		case constants.CYCLE_ADD:
			_state.preset.cycles.push([]);
			store.emitChange();
		break;

		case constants.CYCLE_MOVE_UP:
			if (action.slot) {
				var swap = _state.preset.cycles[action.id][action.slot - 1];
				_state.preset.cycles[action.id][action.slot - 1] = _state.preset.cycles[action.id][action.slot];
				_state.preset.cycles[action.id][action.slot] = swap;
			}
			store.emitChange();
		break;

		case constants.CYCLE_MOVE_DOWN:
			if (action.slot < _state.preset.cycles[action.id].length - 1) {
				var swap = _state.preset.cycles[action.id][action.slot + 1];
				_state.preset.cycles[action.id][action.slot + 1] = _state.preset.cycles[action.id][action.slot];
				_state.preset.cycles[action.id][action.slot] = swap;
			}
			store.emitChange();
		break;

		case constants.CYCLE_ADD_ITEM:
			_state.changer = {mode: 'cycle', data: [], key: action.id, view: -1};
			store.emitChange();
			$('#bind-changer').modal('show');
		break;

		case constants.CYCLE_REMOVE_ITEM:
			_state.preset.cycles[action.id].splice(action.slot, 1);
			store.emitChange();
		break;

		// custom-code

		case constants.CUSTOM_CODE_UPDATE:
			_state.preset.custom = action.value;
			store.emitChange();
		break;

		// changelog

		case constants.CHANGELOG_OPEN:
			var lastAppVersion = localStorage.lastAppVersion || '1.9.2';
			var lastEngineVersion = localStorage.lastEngineVersion || '1.8.2';
			if (
				lastAppVersion && lastEngineVersion && (
					window.compareVersion(lastAppVersion, window.version) === -1
					|
					window.compareVersion(lastEngineVersion, manta.version) === -1
				)
			) {
				$('#dialog-changelog').modal('show');
			}
			localStorage.lastAppVersion = window.version;
			localStorage.lastEngineVersion = manta.version;
		break;

		// other

		case constants.ADD_LAYOUT:
			_state.preset.layouts.push({keybinds:{}});
			store.emitChange();
		break;

		case constants.ACTIVATE_TAB:
			_state.changer.currentTab = action.id;
		break;

		case constants.CHANGE_CHATWHEEL:
			_state.preset.chatwheels[action.wheel][action.slot] = parseInt(action.value, 10);
			store.emitChange();
		break;

		case constants.ADD_CHATWHEEL:
			_state.preset.chatwheels.push([0, 1, 2, 3, 4, 5, 6, 7]);
			store.emitChange();
		break;

		case constants.SHOW_REMOVE_DIALOG:
			_state.dialog.confirmDelete = {
				child: action.child,
				mode: action.mode,
				id: action.id
			};
			store.emitChange();
			$('#dialog-confirm-delete').modal('show');
		break;

		case constants.REMOVE_DIALOG_ABORT:
			$('#dialog-confirm-delete').modal('hide');
		break;

		case constants.REMOVE_DIALOG_CONTINUE:
			$('#dialog-confirm-delete').modal('hide');
			switch (_state.dialog.confirmDelete.mode) {
				case "cycle":
					_state.preset.cycles.splice(_state.dialog.confirmDelete.id, 1);
				break;
				case "chatwheel":
					_state.preset.chatwheels.splice(_state.dialog.confirmDelete.id, 1);
				break;
				case "layout":
					_state.preset.layouts.splice(_state.dialog.confirmDelete.id, 1);
					_state.currentLayout = 0;
				break;
			}
			store.emitChange();
		break;

		case constants.CHANGE_SETTING:
			if (action.id === 'keyboardLayout') {
				// force async
				setTimeout(function () {
					actions.loadKeyboardLayout();
				}, 0);
			}
			if (action.value === undefined) {
				delete _state.preset.settings[action.domain][action.id];
			} else {
				_state.preset.settings[action.domain][action.id] = action.value;
			}
			store.emitChange();
		break;

		case constants.REMAP_ALT_KEY:
			var key = _state.changer.key;
			for (var i = 0; i < _state.preset.layouts.length; i++) {
				delete _state.preset.layouts[i].keybinds[key];
			}
			_state.preset.settings.engine.altKey = key;
			store.emitChange();
			$('#bind-changer').modal('hide');
		break;

		case constants.CHANGE_LAYOUT:
			_state.currentLayout = action.id;
			store.emitChange();
		break;
	}
});

// fill store
store.purge();

module.exports = store;
