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
        return Controller.extend("vcpapp.vcptempidcreation.controller.ItemMaster", {
            onInit: function () {
                that = this;
                this.bus = sap.ui.getCore().getEventBus();
                // this.bus.subscribe("data", "refreshMaster", this.refreshMaster, this);
                // this.bus.publish("nav", "toBeginPage", {
                //     viewName: this.getView().getProperty("viewName"),
                // });
                this.bus.subscribe("data", "RefreshData", this.RefreshItems, this);
                that.oGModel = this.getOwnerComponent().getModel("oGModel");
                that.tabModel = new JSONModel();
                that.projModel = new JSONModel();
                that.prodModel = new JSONModel();
                that.projModel.setSizeLimit(1000);
                that.prodModel.setSizeLimit(1000);
                that.tabModel.setSizeLimit(10000);
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

            
            onAfterRendering: function () {
                // that.HeaderData = [];
                // that.ItemData = [];
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
                        else {
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
            onGetData: function () {
                that.mainArray=[];
                sap.ui.core.BusyIndicator.show();
                var selectedProd = that.byId("idConfigProd").getValue();
                var selectedProj = that.byId("idProjDet").getValue();
                if (selectedProd && selectedProj) {
                    that.byId("newTabSearch").setValue();
                    that.tabModel = new JSONModel();
                    that.tabModel.setSizeLimit(10000);
                    that.byId("idTempDetails").setModel(that.tabModel);
                    this.getOwnerComponent().getModel("BModel").callFunction("/tmpuniqueid", {
                        method: "GET",
                        urlParameters: {
                            PROJECT_ID: selectedProj,
                            PRODUCT_ID: selectedProd
                        },
                        success: function (oData) {
                            that.headerData = [], that.itemData = [], that.genFlag;
                            // that.headerData= JSON.parse(oData.tmpuniqueid);
                            // that.oGModel.setProperty("/uniqueData",that.headerData);
                            // that.itemData = that.headerData[1];
                            that.genFlag = oData.results[0].GenFlag;
                            that.oGModel.setProperty("/genFlag",that.genFlag);
                            if (oData.results[0].GenFlag === "X") {
                                that.oGModel.setProperty("/delFlag",true);
                                that.TmpUIDCreation(oData.results);
                                // that.generateData(oData.results);
                                var finalData = that.HeaderData;
                                that.oGModel.setProperty("/uniqueItemData", that.ItemData);
                                that.byId("idGen").setEnabled(true);
                                that.byId("idGen").setVisible(true);
                                that.byId("idSave").setEnabled(false);
                                that.byId("idSave").setVisible(false);
                            }
                            else {
                                that.oGModel.setProperty("/delFlag",false);

                                var finalData = JSON.parse(oData.results[0].UID);
                                that.oGModel.setProperty("/uniqueItemData", JSON.parse(oData.results[0].ITEMDATA));
                                that.byId("idSave").setEnabled(true);
                                that.byId("idSave").setVisible(true);
                                that.byId("idGen").setEnabled(false);
                                that.byId("idGen").setVisible(false);
                                finalData = finalData.sort((a, b) => parseInt(a.TMP_UNIQUE_ID.match(/\d+/g)[0]) - parseInt(b.TMP_UNIQUE_ID.match(/\d+/g)[0]));
                            }
                            

                            

                            that.tabModel.setData({ tempDetails: finalData });
                            that.byId("idTempDetails").setModel(that.tabModel);

                            if(oData.results[0].UID.length > 0){
                            that.byId("idTempDetails").getItems()[0].setSelected(true);
                            that.onHandleSelect();
                            // that.byId("idTempDetails").selectedItem()
                            }
                            sap.ui.core.BusyIndicator.hide();


                        },
                        error: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Failed to get details");
                        },
                    });
                }
                else {

                }
            },
            handleProjSelection: function (oEvent) {
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
            oHomesearch: function (oEvent) {
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
                                    new Filter("UNIQUE_DESC", FilterOperator.Contains, sQuery),
                                    new Filter("REF_UNIQUE_ID", FilterOperator.EQ, sQuery),
                                    new Filter("TMP_UNIQUE_ID", FilterOperator.EQ, sQuery),
                                    // new Filter("CHAR_VALUE", FilterOperator.EQ, sQuery),
                                    // new Filter("REF_CHAR_VALUE", FilterOperator.EQ, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.byId("idTempDetails").getBinding("items").filter(oFilters);
                }
            },
            /**On Reset Press */
            onResetData: function () {
                that.byId("idConfigProd").setValue("");
                that.byId("idProjDet").setValue("");
                that.byId("newTabSearch").setValue();
                that.byId("idTempDetails").getBinding("items").filter([]);
                that.tabModel.setData({ tempDetails: [] });
                that.byId("idTempDetails").setModel(that.tabModel);
            },
            /**
                 * Called when it routes to a page containing the item details.
                 */
            onHandleSelect: function (oEvent) {
                // oGModel = that.getModel("oGModel");
                if (oEvent) {
                    var sSelItem = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
                    that.oGModel.setProperty("/RefuniqId", sSelItem.REF_UNIQUE_ID);
                    that.oGModel.setProperty("/uniqId", sSelItem.TMP_UNIQUE_ID);
                }
                else {
                    // var sSelItem = that.oGModel.getProperty("/uniqueData")[0];
                    var sSelItem = that.byId("idTempDetails").getItems()[0].getCells();
                    that.oGModel.setProperty("/RefuniqId", parseInt(sSelItem[1].getTitle()));
                    that.oGModel.setProperty("/uniqId", sSelItem[0].getText());
                }
                // Calling Item Detail page
                that.getOwnerComponent().runAsOwner(function () {
                    if (!that.oDetailView) {
                        try {
                            that.oDetailView = sap.ui.view({
                                viewName: "vcpapp.vcptempidcreation.view.ItemDetail",
                                type: "XML",
                            });
                            that.bus.publish("flexible", "addDetailPage", that.oDetailView);
                            that.bus.publish("nav", "toDetailPage", {
                                viewName: that.oDetailView.getViewName(),
                            });
                        } catch (e) {
                            that.oDetailView.onAfterRendering();
                        }
                    } else {
                        that.bus.publish("nav", "toDetailPage", {
                            viewName: that.oDetailView.getViewName(),
                        });
                    }
                });
            },



            TmpUIDCreation:function(Data){
                var TempData = Data;
                var UID = JSON.parse(Data[0].UID);
                var ItemUIDS = JSON.parse(Data[0].ITEMDATA);
                var TmpmaxValue = parseInt(Data[0].MaxValue);
                var ItemData, idsInArray1, CharCount = 0;
                var configArray = [];
                var HeaderArray = [],
                    ItemArray   = [];

                var tempHeader = {};
                var tempItem = {};

                    UID = UID.sort((a, b) => a.TMP_ID - b.TMP_ID);
                for (var v = 0; v < UID.length; v++) {
                    tempHeader['REF_UNIQUE_ID'] = UID[v].REF_UNIQUE_ID;
                    tempHeader['PRODUCT_ID'] = UID[v].PRODUCT_ID;
                    tempHeader['TMP_UNIQUE_DESC'] = UID[v].TMP_UNIQUE_DESC;
                    tempHeader['PROJECT_ID'] = UID[v].PROJECT_ID;
                    tempHeader['WEIGHTAGE'] = UID[v].WEIGHTAGE;
                    tempHeader['VALID_FROM'] = UID[v].VALID_FROM;
                    tempHeader['VALID_TO'] = UID[v].VALID_TO;
                    tempHeader['TMP_ID'] = UID[v].TMP_ID;

                    if(UID[v].DUPLICATE === 0){
                        TmpmaxValue = TmpmaxValue + 1
                        tempHeader['TMP_UNIQUE_ID'] = "NPI" + TmpmaxValue;
                    } else {
                        var index = HeaderArray.findIndex(el=> el.TMP_ID === UID[v].DUPLICATE);
                        tempHeader['TMP_UNIQUE_ID'] = HeaderArray[index].TMP_UNIQUE_ID;
                    }

                    var Temp = ItemUIDS.filter(el=> el.TMP_ID === UID[v].TMP_ID);

                    Temp.forEach(ele => {
                        tempItem['REF_UNIQUE_ID'] = UID[v].REF_UNIQUE_ID;
                        tempItem['PRODUCT_ID'] = UID[v].PRODUCT_ID;
                        tempItem['PROJECT_ID'] = UID[v].PROJECT_ID;
                        tempItem['TMP_UNIQUE_ID'] = tempHeader['TMP_UNIQUE_ID'];
                        tempItem['CHAR_NUM'] = ele.CHAR_NUM;
                        tempItem['CHARVAL_NUM'] = ele.CHARVAL_NUM;
                        tempItem['CHAR_VALUE'] = ele.CHAR_VALUE;
                        tempItem['CHAR_DESC'] = ele.CHAR_DESC;
                        tempItem['CHARVAL_DESC'] = ele.CHARVAL_DESC;

                        ItemArray.push(tempItem);
                        tempItem = {};
                    });

                    HeaderArray.push(tempHeader);
                    tempHeader = {};

                }

                that.HeaderData = HeaderArray;
                that.ItemData = ItemArray;

            },

            generateData: function (Data) {

                var TempData = Data;
                var UID = JSON.parse(Data[0].UID);
                var TempUIDS = JSON.parse(Data[0].ITEMDATA);
                var CharValues = Data[0].CHARVALUES;
                var TmpmaxValue = Data[0].MaxValue;
                var ItemData, idsInArray1, CharCount = 0;
                var configArray = [];


                const countMap = new Map();
                // Iterate over the array and count occurrences of REF_CHARVAL
                CharValues.forEach(item => {
                    const refCharval = item.REF_CHAR_VALUE;

                    if (countMap.has(refCharval)) {
                        countMap.set(refCharval, countMap.get(refCharval) + 1);
                    } else {
                        countMap.set(refCharval, 1);
                    }

                });

                // Convert the map to the desired output array format
                const output = [];
                countMap.forEach((count, refCharval) => {
                    output.push({ REF_CHAR_VALUE: refCharval, COUNT: count });
                });

                // Extract the 'id' values from array1
                idsInArray1 = UID.map(item => item.REF_UNIQUE_ID);
                // Filter array2 to include only items with 'id' present in array1
                ItemData = TempUIDS.filter(item => idsInArray1.includes(item.UNIQUE_ID));

                for (var v = 0; v < UID.length; v++) {
                    var lsChar = {};
                    var lsUnique = {},
                        lsUnique1 = {};

                    CharCount = 0;

                    // TmpmaxValue = TmpmaxValue + 1;
                    // lsUnique['UNIQUE_ID'] = "NPI" + TmpmaxValue
                    lsUnique['REF_UNIQUE_ID'] = UID[v].REF_UNIQUE_ID;
                    lsUnique['PRODUCT_ID'] = UID[v].PRODUCT_ID;
                    lsUnique['TMP_UNIQUE_DESC'] = UID[v].UNIQUE_DESC;
                    lsUnique['UID_TYPE'] = UID[v].UID_TYPE;
                    lsUnique['PROJECT_ID'] = UID[v].PROJECT_ID;
                    // lsUnique['WEIGHT'] = UID[v].WEIGHT;
                    // lsUnique['VALID_FROM'] = UID[v].VALID_FROM;
                    // lsUnique['VALID_TO'] = UID[v].VALID_TO;
                    lsUnique['CONFIG'] = [];
                    lsUnique1['CONFIG'] = [];

                    var itemDataTemp = ItemData.filter(item => item.UNIQUE_ID == UID[v].REF_UNIQUE_ID);
                    var newCharCountArr = [];
                    for (var cntU = 0; cntU < itemDataTemp.length; cntU++) {
                        var lsUniqueConfig = {};

                        var charCount = output.filter(item => item.REF_CHAR_VALUE == itemDataTemp[cntU].CHAR_VALUE);
                        if (charCount.length > 0) {
                            itemDataTemp[cntU]['Count'] = charCount[0].COUNT;
                            newCharCountArr.push(itemDataTemp[cntU]);


                        }
                        else {
                            lsUniqueConfig['CHAR_NUM'] = itemDataTemp[cntU].CHAR_NUM;
                            lsUniqueConfig['CHARVAL_NUM'] = itemDataTemp[cntU].CHARVAL_NUM;
                            lsUniqueConfig['CHAR_VALUE'] = itemDataTemp[cntU].CHAR_VALUE;


                            lsUniqueConfig['CHAR_DESC'] = itemDataTemp[cntU].CHAR_DESC;
                            lsUniqueConfig['CHARVAL_DESC'] = itemDataTemp[cntU].CHARVAL_DESC;
                            // lsUniqueConfig['CHAR_VALUE'] = itemDataTemp[cntU].CHAR_VALUE;


                            lsUnique1['CONFIG'].push(lsUniqueConfig);
                        }
                    }
                    var tempArrays = [];
                    var test = [];
                    var DescArray = [];
                    if (newCharCountArr.length > 0) {
                        for (var cnt = 0; cnt < CharValues.length; cnt++) {
                            test = [];
                            test['CONFIG'] = '';
                            test.Weight = CharValues[cnt].WEIGHT;
                            test.fromdate = CharValues[cnt].VALID_FROM;
                            test.todate = CharValues[cnt].VALID_TO;

                            /// test case ///
                            var itemDataTemp1 = ItemData.filter(item => item.CHAR_VALUE === CharValues[cnt].CHAR_VALUE);
                            if (itemDataTemp1.length > 0) {
                                DescArray.push(itemDataTemp1[0]);
                            }

                            // End




                            for (var c = 0; c < newCharCountArr.length; c++) {
                                if (newCharCountArr[c].CHAR_VALUE === CharValues[cnt].REF_CHAR_VALUE) {
                                    lsUniqueConfig = {};
                                    lsUniqueConfig['CHAR_NUM'] = newCharCountArr[c].CHAR_NUM;
                                    // lsUniqueConfig['CHARVAL_NUM'] = newCharCountArr[c].CHARVAL_NUM;
                                    lsUniqueConfig['CHARVAL_NUM'] = CharValues[cnt].CHAR_VALUE;
                                    lsUniqueConfig['CHAR_VALUE'] = CharValues[cnt].CHAR_VALUE;
                                    test['CONFIG'] = lsUniqueConfig
                                    tempArrays.push(test);

                                    // tempArrays.push(lsUniqueConfig);
                                }

                            }
                        }

                        function generateCombinations(array) {
                            // Group the array elements by CHAR_NUM
                            const grouped = array.reduce((acc, obj) => {
                                acc[obj.CONFIG.CHAR_NUM] = acc[obj.CONFIG.CHAR_NUM] || [];
                                acc[obj.CONFIG.CHAR_NUM].push(obj);
                                return acc;
                            }, {});

                            const keys = Object.keys(grouped);
                            const result = [];
                            const result1 = [];
                            var wt = 100;

                            function combine(index, current) {
                                if (index === keys.length) {
                                    result.push([...current]);
                                    return;
                                }

                                grouped[keys[index]].forEach(obj => {
                                    // current.push(obj.CONFIG);
                                    current.push(obj);

                                    combine(index + 1, current);
                                    current.pop();
                                });
                            }

                            combine(0, []);
                            return result;
                        }

                        const combinations = generateCombinations(tempArrays);

                        // if(combinations.length > 0){

                        for (var comb = 0; comb < combinations.length; comb++) {
                            var newlsUnniqe = {};
                            var newUID = 0;
                            newlsUnniqe = JSON.parse(JSON.stringify(lsUnique));
                            var lsConfig = [];
                            var newConfig = [];
                            var wt = 101;
                            var fromdate = "", todate = "";
                            for (var l = 0; l < combinations[comb].length; l++) {
                                //// Test case
                                var tempDesc = DescArray.filter(el => el.CHAR_VALUE === combinations[comb][l].CONFIG.CHAR_VALUE);
                                if (tempDesc.length > 0) {
                                    combinations[comb][l].CONFIG['CHAR_DESC'] = tempDesc[0].CHAR_DESC;
                                    combinations[comb][l].CONFIG['CHARVAL_DESC'] = tempDesc[0].CHARVAL_DESC;
                                }


                                //// end
                                lsConfig = lsConfig.concat(combinations[comb][l].CONFIG);
                                if (wt > combinations[comb][l].Weight) {
                                    wt = combinations[comb][l].Weight;
                                }
                                if (fromdate === "") {
                                    fromdate = combinations[comb][l].fromdate;
                                } else if (new Date(fromdate) > new Date(combinations[comb][l].fromdate)) {
                                    fromdate = combinations[comb][l].fromdate;
                                }
                                if (todate === "") {
                                    todate = combinations[comb][l].todate;
                                } else if (new Date(todate) < new Date(combinations[comb][l].todate)) {
                                    todate = combinations[comb][l].todate;
                                }

                            }

                            newConfig = lsConfig.concat(lsUnique1.CONFIG);
                            // newConfig.sort(GenF.dynamicSortMultiple("CHAR_NUM"));
                            newConfig = newConfig.sort((a, b) => a.CHAR_NUM - b.CHAR_NUM);

                            // to Check the duplicate configuration
                            for (var conf = 0; conf < configArray.length; conf++) {
                                if (JSON.stringify(newConfig) === JSON.stringify(configArray[conf]['CONFIG'])) {

                                    newlsUnniqe['TMP_UNIQUE_ID'] = configArray[conf].TMP_UNIQUE_ID;
                                    newlsUnniqe['CONFIG'] = newConfig;
                                    newUID = 1;
                                    break;
                                }
                            }

                            if (newUID === 0) {
                                TmpmaxValue = TmpmaxValue + 1;
                                newlsUnniqe['TMP_UNIQUE_ID'] = "NPI" + TmpmaxValue;
                                newlsUnniqe['CONFIG'] = newConfig;
                            }


                            newlsUnniqe['WEIGHTAGE'] = wt;
                            newlsUnniqe['VALID_FROM'] = fromdate;
                            newlsUnniqe['VALID_TO'] = todate;
                            configArray.push(newlsUnniqe);
                            CharCount = 1;

                        }
                    } else {
                        lsUnique['CONFIG'] = lsUnique1.CONFIG;
                        TmpmaxValue = TmpmaxValue + 1;
                        lsUnique['TMP_UNIQUE_ID'] = "NPI" + TmpmaxValue;
                        CharCount = 0;
                    }

                    if (CharCount === 0) {
                        configArray.push(lsUnique);
                    }

                }

                that.ConfigArray = configArray;
            },
            onInputChange: function (oEvent) {
                var path = oEvent.getSource().getBindingContext().getPath();
                var Data = that.byId("idTempDetails").getModel().getProperty(path);
                if(that.genFlag==="X"){               
                var index = that.HeaderData.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                that.HeaderData[index].WEIGHTAGE = parseInt(oEvent.getParameters("value").value);
                }
                else{
                var index = that.mainArray.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                if(index === -1){
                    var newObject = {
                        PRODUCT_ID: Data.PRODUCT_ID,
                        PROJECT_ID: Data.PROJECT_ID,
                        TMP_UNIQUE_ID:  Data.TMP_UNIQUE_ID,
                        REF_UNIQUE_ID:  Data.REF_UNIQUE_ID,
                        WEIGHTAGE:     parseInt(oEvent.getParameters("value").value),
                        VALID_FROM: Data.VALID_FROM,
                        VALID_TO:   Data.VALID_TO
                    }
                    that.mainArray.push(newObject);
                }  
                else{
                    that.mainArray[index].WEIGHTAGE = parseInt(oEvent.getParameters("value").value);
                }
                }
            },

            onFromDateChange: function (oEvent) {
                var path = oEvent.getSource().getBindingContext().getPath();
                var Data = that.byId("idTempDetails").getModel().getProperty(path);
                if(that.genFlag ==="X"){
                var index = that.HeaderData.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                var FromDate = new Date(oEvent.getParameters("value").value);
                var ToDate = new Date(that.HeaderData[index].VALID_TO);
                if (FromDate < ToDate) {
                    that.byId("idSave").setEnabled(true);
                    that.byId("idGen").setEnabled(true);
                    that.HeaderData[index].VALID_FROM = (oEvent.getParameters("value").value);
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                }
                else if (FromDate > ToDate) {
                    MessageToast.show("From date cannot be after To date");
                    that.byId("idSave").setEnabled(false);
                    that.byId("idGen").setEnabled(false);
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("From date cannot be after To date");
                }
            }
            else{
                var index = that.mainArray.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                if(index === -1){
                    var FromDate = new Date(oEvent.getParameters("value").value);
                    var ToDate = new Date(Data.VALID_TO);
                    if (FromDate < ToDate) {
                    var newObject = {
                        PRODUCT_ID: Data.PRODUCT_ID,
                        PROJECT_ID: Data.PROJECT_ID,
                        TMP_UNIQUE_ID:  Data.TMP_UNIQUE_ID,
                        REF_UNIQUE_ID:  Data.REF_UNIQUE_ID,
                        WEIGHTAGE:     Data.WEIGHTAGE,
                        VALID_FROM: oEvent.getParameters("value").value,
                        VALID_TO:   Data.VALID_TO
                    }
                    that.mainArray.push(newObject);
                    that.byId("idSave").setEnabled(true);
                    that.byId("idGen").setEnabled(true);
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                }
                else if(FromDate > ToDate){
                    MessageToast.show("From date cannot be after To date");
                    that.byId("idSave").setEnabled(false);
                    that.byId("idGen").setEnabled(false);
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Valid From date cannot be after Valid To date");
                }
                }
                else{
                    var FromDate = new Date(oEvent.getParameters("value").value);
                    var ToDate = new Date(that.mainArray[index].VALID_TO);
                    if (FromDate < ToDate) {
                        that.byId("idSave").setEnabled(true);
                        that.byId("idGen").setEnabled(true);
                        that.mainArray[index].VALID_FROM = (oEvent.getParameters("value").value);
                        oEvent.getSource().setValueState("None");
                        oEvent.getSource().setValueStateText("");
                    }
                    else if (FromDate > ToDate) {
                        MessageToast.show("From date cannot be after To date");
                        that.byId("idSave").setEnabled(false);
                        that.byId("idGen").setEnabled(false);
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("From date cannot be after To date");
                    }
                }
            }
            },
            onToDateChange: function (oEvent) {
                var path = oEvent.getSource().getBindingContext().getPath();
                var Data = that.byId("idTempDetails").getModel().getProperty(path);
                if(that.genFlag ==="X"){
                var index = that.HeaderData.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                var FromDate = new Date(that.HeaderData[index].VALID_FROM);
                var ToDate = new Date(oEvent.getParameters("value").value);
                if (FromDate > ToDate) {
                    MessageToast.show("To date cannot be before From date");
                    that.byId("idSave").setEnabled(false);
                    that.byId("idGen").setEnabled(false);
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("To date cannot be before From date");
                }
                else if (FromDate < ToDate) {
                    that.byId("idSave").setEnabled(true);
                    that.byId("idGen").setEnabled(true);
                    that.HeaderData[index].VALID_TO = (oEvent.getParameters("value").value);
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                }
            }
            else{
                var index = that.mainArray.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                if(index === -1){
                    var FromDate = new Date(Data.VALID_FROM);
                    var ToDate = new Date(oEvent.getParameters("value").value);
                    if (FromDate < ToDate) {
                    var newObject = {
                        PRODUCT_ID: Data.PRODUCT_ID,
                        PROJECT_ID: Data.PROJECT_ID,
                        TMP_UNIQUE_ID:  Data.TMP_UNIQUE_ID,
                        REF_UNIQUE_ID:  Data.REF_UNIQUE_ID,
                        WEIGHTAGE:     Data.WEIGHTAGE,
                        VALID_FROM: Data.VALID_FROM,
                        VALID_TO:   oEvent.getParameters("value").value
                    }
                    that.mainArray.push(newObject);
                    that.byId("idSave").setEnabled(true);
                    that.byId("idGen").setEnabled(true);
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                }
                else if(FromDate > ToDate){
                    MessageToast.show("From date cannot be after To date");
                    that.byId("idSave").setEnabled(false);
                    that.byId("idGen").setEnabled(false);
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Valid From date cannot be after Valid To date");
                }
                }
                else{
                    var FromDate = new Date(that.mainArray[index].VALID_FROM);
                    var ToDate = new Date(oEvent.getParameters("value").value);
                    if (FromDate < ToDate) {
                        that.byId("idSave").setEnabled(true);
                        that.byId("idGen").setEnabled(true);
                        that.mainArray[index].VALID_TO = (oEvent.getParameters("value").value);
                        oEvent.getSource().setValueState("None");
                        oEvent.getSource().setValueStateText("");
                    }
                    else if (FromDate > ToDate) {
                        MessageToast.show("From date cannot be after To date");
                        that.byId("idSave").setEnabled(false);
                        that.byId("idGen").setEnabled(false);
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("From date cannot be after To date");
                    }
                }
            }
            },

            // Delete Tmp UID
            onDeleteUID:function(oEvent){
                var path = oEvent.getSource().getBindingContext().getPath();
                var Data = that.byId("idTempDetails").getModel().getProperty(path);
                if(that.genFlag ==="X"){
                
                    var index = that.HeaderData.findIndex(el => el.REF_UNIQUE_ID === Data.REF_UNIQUE_ID && el.TMP_UNIQUE_ID === Data.TMP_UNIQUE_ID);
                    var TMPID = that.HeaderData[index].TMP_ID;
                    that.HeaderData.splice(index, 1);
                    that.byId("idTempDetails").getBinding("items").refresh();
                }


            },


            onCharSearch:function(oEvent){
                var sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue"),
                sId = oEvent.getParameter("id"),
                oFilters = [];
                var FItemData = that.oGModel.getProperty("/uniqueItemData");
                var HeadData = that.HeaderData;
                var ItemData = that.ItemData;


                if(sQuery !== ""){
                var FilterData =  FItemData.filter(el=> el.CHAR_NUM === sQuery || el.CHAR_VALUE === sQuery || el.CHAR_DESC === sQuery || el.CHARVAL_DESC === sQuery)
            
                function removeDuplicate(array, key) {
                    var check = new Set();
                            return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                        }
                    var DupRemData = removeDuplicate(FilterData, 'TMP_UNIQUE_ID');
                
                

                if(DupRemData.length > 0){
                    // Extract the 'id' values from array1
                    var idsInArray1 = DupRemData.map(item => item.TMP_UNIQUE_ID);
                    // Filter array2 to include only items with 'id' present in array1
                    var filteredHeaderData = HeadData.filter(item => idsInArray1.includes(item.TMP_UNIQUE_ID));
                    // var filteredItemData = ItemData.filter(item => idsInArray1.includes(item.TMP_UNIQUE_ID));
                // } else {
                //     var filteredHeaderData = [];
                }
            } else {
                var filteredHeaderData = HeadData;
            }


            // that.oGModel.setProperty("/uniqueItemData", that.ItemData);
            that.tabModel =  new JSONModel();
            that.tabModel.setData({ tempDetails: filteredHeaderData });
            that.byId("idTempDetails").setModel(that.tabModel);
            if(filteredHeaderData.length > 0){
                that.byId("idTempDetails").getItems()[0].setSelected(true);
                that.onHandleSelect();
            }

            },

            RefreshItems:function(oEvent){
               var DupRemData = that.oGModel.getProperty("/DuplicateRemData");

               var HeadData = that.HeaderData;
                var ItemData = that.ItemData;

                if(DupRemData.length !== 0){
                    // Extract the 'id' values from array1
                    var idsInArray1 = DupRemData.map(item => item.TMP_UNIQUE_ID);
                    // Filter array2 to include only items with 'id' present in array1
                    var filteredHeaderData = HeadData.filter(item => idsInArray1.includes(item.TMP_UNIQUE_ID));
                    // var filteredItemData = ItemData.filter(item => idsInArray1.includes(item.TMP_UNIQUE_ID));
                } else {
                    var filteredHeaderData = HeadData
                }


            // that.oGModel.setProperty("/uniqueItemData", that.ItemData);
            that.tabModel =  new JSONModel();
            that.tabModel.setData({ tempDetails: filteredHeaderData });
            that.byId("idTempDetails").setModel(that.tabModel);
            that.byId("idTempDetails").getItems()[0].setSelected(true);
            that.onHandleSelect();


            },


            /**On Press of Generate */
            onGeneratePress: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                if(that.genFlag === "X" && oEvent.getParameters().id.includes("idGen")){
                    var HeadData1 = that.HeaderData;
                    var ItemData = that.ItemData;

                    function removeProperty (array, property) {   
                        return array.map(obj => {                       
                        const newObj = { ...obj };  
                       delete newObj[property];                        
                       return newObj;   
                    }); 
                };    
                
                       // Remove the 'TMP_ID' property from each object                       
                       var  HeadData = removeProperty(HeadData1, 'TMP_ID');
                       
                        
                }
                else{
                    var HeadData = that.mainArray;
                    var ItemData = [];
                }

                if(HeadData.length > 0){
                this.getOwnerComponent().getModel("BModel").callFunction("/genTmpUniqueID", {
                    method: "GET",
                    urlParameters: {
                        Flag : that.genFlag,
                        HeadData: JSON.stringify(HeadData),
                        ItemData : JSON.stringify(ItemData)
                    },
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide()
                        MessageToast.show(oData.genTmpUniqueID);
                        if(oData.genTmpUniqueID.includes("Created") || oData.genTmpUniqueID.includes("updated")){
                            that.onGetData();
                        }
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show(error.Message);
                    },
                });
            } else {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show("No Data to generate (or) update");
            }

            }
        });
    });