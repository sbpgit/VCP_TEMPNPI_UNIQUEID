sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "sap/ui/core/util/File",
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
],
function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, Device, Fragment, File, library, Spreadsheet) {
    "use strict";
    var that, oGModel;
    return Controller.extend("vcpapp.vcptempidcreation.controller.Home", {
        onInit: function () {
            that = this;
            that.oGModel = this.getOwnerComponent().getModel("oGModel");
                that.tabModel = new JSONModel();
                that.projModel = new JSONModel();
                that.prodModel = new JSONModel();
                that.projModel.setSizeLimit(1000);
                that.prodModel.setSizeLimit(1000);
                that.tabModel.setSizeLimit(1000);
                if (!this._valueHelpDialogProjectDet) {
                    this._valueHelpDialogProjectDet = sap.ui.xmlfragment(
                        "vcpapp.vcptempidcreation.view.MultiProjectDetails",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogProjectDet);
                }
                if (!this._valueHelpDialogProd) {
                    this._valueHelpDialogProd = sap.ui.xmlfragment(
                        "vcpapp.vcptempidcreation.view.ProdDialog",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogProd);
                }
        },
        onAfterRendering:function(){
            
            this.getOwnerComponent().getModel("BModel").read("/getProjDetails", {
                method: "GET",
                success: function (oData) {
                    if (oData.results.length > 0) {
                        that.tabProjDe = [];
                        that.tabProjDe = oData.results;
                        that.tabProjDe.forEach(function (oItem) {
                            if (oItem.PROJ_STATUS === true) {
                                oItem.PROJ_STATUS = "Active";
                            }
                            else {
                                oItem.PROJ_STATUS = "InActive";
                            }

                        });
                        that.projModel.setData({ projDetails: that.tabProjDe });
                        sap.ui.getCore().byId("idProjDetailsFrag").setModel(that.projModel);
                    }
                    else{
                        MessageToast.show("No Projects available");
                    }
                    sap.ui.core.BusyIndicator.hide()
                },
                error: function () {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Failed to get project details");
                },
            });
            this.getOwnerComponent().getModel("BModel").read("/getProducts", {
                method: "GET",
                success: function (oData) {
                    that.prodModel.setData({ configProdRes: oData.results });
                    sap.ui.getCore().byId("prodSlctListOD").setModel(that.prodModel);
                    sap.ui.core.BusyIndicator.hide()
                },
                error: function () {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Failed to get configurable products");
                },
            });
        },
        onGetData:function(){
            sap.ui.core.BusyIndicator.show()
            var selectedProd = that.byId("idConfigProd").getValue();
            var selectedProj = that.byId("idProjDet").getValue();
            if(selectedProd && selectedProj){
                this.getOwnerComponent().getModel("BModel").callFunction("/tmpuniqueid", {
                    method: "GET",
                    urlParameters: {
                        PROJECT_ID: selectedProj,
                        PRODUCT_ID: selectedProd
                    },
                    success: function (oData) {
                        that.tabModel.setData({ tempDetails: oData.results });
                        that.byId("idTempDetails").setModel(that.tabModel);
                        sap.ui.core.BusyIndicator.hide()
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to get details");
                    },
                });
            }
            else{

            }
        },
        handleProjSelection:function(oEvent){
            var selectedItemz = oEvent.getParameters().selectedItem.getTitle();
            that.byId("idProjDet").setValue(selectedItemz);
            sap.ui.getCore().byId("idProjDetailsFrag").getBinding("items").filter([]);
            sap.ui.getCore().byId("idProjDetailsFrag").clearSelection();
        },
          /**On Selection of config product in prod dialog */
          handleSelection: function (oEvent) {
            var selectedItem = oEvent.getParameters().selectedItems[0].getTitle();
            that.byId("idConfigProd").setValue(selectedItem);
            sap.ui.getCore().byId("prodSlctListOD").getBinding("items").filter([]);
            sap.ui.getCore().byId("prodSlctListOD").clearSelection();
        },
        handleValueHelp: function (oEvent) {
            var sId = oEvent.getParameter("id");
            // Prod Dialog
            if (sId.includes("ConfigProd")) {
                that._valueHelpDialogProd.open();
            }
            else if (sId.includes("idProjDet")) {
                that._valueHelpDialogProjectDet.open();
            }
        },
        /**Search on Home Screen */
        oHomesearch:function(oEvent){
            var sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue"),
            sId = oEvent.getParameter("id"),
            oFilters = [];
        // Check if search filter is to be applied
        sQuery = sQuery ? sQuery.trim() : "";
        // Location
        if (sId.includes("newTabSearch")) {
            if (sQuery !== "") {
                oFilters.push(
                    new Filter({
                        filters: [
                            new Filter("REF_CHAR_VALUE", FilterOperator.Contains, sQuery),
                            new Filter("REF_UNIQUE_ID", FilterOperator.EQ, sQuery)
                        ],
                        and: false,
                    })
                );
            }
            that.byId("idTempDetails").getBinding("items").filter(oFilters);
        }
        },
        /**On Reset Press */
        onResetData:function(){
            that.byId("idConfigProd").setValue("");
            that.byId("idProjDet").setValue("");
            that.byId("newTabSearch").setValue();
            that.byId("idTempDetails").getBinding("items").filter([]);
            that.tabModel.setData({ tempDetails: [] });
            that.byId("idTempDetails").setModel(that.tabModel);
        }
    });
});
