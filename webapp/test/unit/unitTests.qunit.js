/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"vcpapp/vcp_tempid_creation/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
