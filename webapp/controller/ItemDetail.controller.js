sap.ui.define(
    [
        "vcpapp/vcptempidcreation/controller/BaseController",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/Device",
        "sap/ui/core/Fragment"
    ],
    function (
        BaseController,
        MessageToast,
        MessageBox,
        JSONModel,
        Filter,
        FilterOperator,
        Device,
        Fragment

    ) {
        "use strict";
        var that, oGModel;
        var aResults;
    

        return BaseController.extend("vcpapp.vcptempidcreation.controller.ItemDetail", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */
            onInit: function () {
                that = this;
                this.bus = sap.ui.getCore().getEventBus();
                // Declaring JSON Models and size limit
                that.oCharModel = new JSONModel();
                this.oCharModel.setSizeLimit(1000);
            },
            onAfterRendering: function () {
                that.oGModel = that.getOwnerComponent().getModel("oGModel");
                sap.ui.core.BusyIndicator.show();
                var srefUniqId = that.oGModel.getProperty("/RefuniqId");
                var sUniqId = that.oGModel.getProperty("/uniqId");
                that.totalUniqeData = that.oGModel.getProperty("/uniqueData");
                that.tableData = that.totalUniqeData.filter(f => f.REF_UNIQUE_ID === srefUniqId && f.UNIQUE_ID === sUniqId);
                that.oCharModel.setData({results1:that.tableData[0].CONFIG});
                that.byId("idMatvarItem").setModel(that.oCharModel);

                // var tmpuid = "Temp UID" + " - " + that.tableData[0].UNIQUE_ID;
                // var refuid = "Ref UID" + " - " + that.tableData[0].REF_UNIQUE_ID;
                that.byId("TmpUID").setText(that.tableData[0].UNIQUE_ID);
                that.byId("RefUID").setText(that.tableData[0].REF_UNIQUE_ID);
                sap.ui.core.BusyIndicator.hide();
            },
            onCharSearch:function(){
                var sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue"),
                sId = oEvent.getParameter("id"),
                oFilters = [];
            // Check if search filter is to be applied
            sQuery = sQuery ? sQuery.trim() : "";
            // Location
            if (sId.includes("idCharSearch")) {
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("CHAR_NUM", FilterOperator.Contains, sQuery),
                                new Filter("CHAR_DESC", FilterOperator.EQ, sQuery),
                                new Filter("CHAR_VALUE", FilterOperator.Contains, sQuery),
                                new Filter("CHARVAL_DESC", FilterOperator.EQ, sQuery)
                            ],
                            and: false,
                        })
                    );
                }
                that.byId("idMatvarItem").getBinding("items").filter(oFilters);
            }
            }
        });
    });