(function () {
    'use strict';

    // Controller name is handy for logging
    var controllerId = 'attendees';

    // Define the controller on the module.
    // Inject the dependencies. 
    // Point to the controller definition function.
    angular.module('app').controller(controllerId,
        ['common', 'config', 'datacontext', attendees]);

    function attendees(common, config, datacontext) {
        // Using 'Controller As' syntax, so we assign this to the vm variable (for viewmodel).
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        // Bindable properties and functions are placed on vm.
        vm.attendees = [];
        vm.attendeeCount = 0;
        vm.attendeeFilteredCount = 0;
        vm.attendeeSearch = '';
        vm.filteredAttendees = [];
        vm.pageChanged = pageChanged;
        //object literal
        vm.paging = {
            currentPage: 1,
            maxPagesToShow: 5,
            pageSize: 15
        };
        vm.refresh = refresh;
        vm.search = search;
        vm.title = 'Attendees';
        
        Object.defineProperty(vm.paging, 'pageCount', {
            get: function() {
                return Math.floor(vm.attendeeFilteredCount / vm.paging.pageSize) + 1;
            }
        });

        activate();

        function activate() {
            //get our attendees

            common.activateController([getAttendees()], controllerId)
                .then(function () { log('Activated Attendees View'); });
        }

        //#region Internal Methods        

        function getAttendeeCount() {
            return datacontext.getAttendeeCount().then(function (data) {
                return vm.attendeeCount = data;
            });
        }

        function getAttendeeFilteredCount() {
            
            vm.attendeeFilteredCount = datacontext.getFilteredCount(vm.attendeeSearch);
        }

        function getAttendees(forceRefresh) { //or pass forceRemote
            return datacontext.getAttendees(forceRefresh, vm.paging.currentPage, vm.paging.pageSize, vm.attendeeSearch).then(
                function (data) {
                    vm.attendees = data;
                    getAttendeeFilteredCount();
                    if(!vm.attendeeCount || forceRefresh) {
                        getAttendeeCount();
                    }
                    return data;
                });
        }
        

        function pageChanged(page) {
            if (!page) {
                return;
            }
            vm.paging.currentPage = page;
            getAttendees();
        }

        function refresh() {
            getAttendees(true);
        }

        function search($event) {
            if ($event.keyCode === keyCodes.esc) {
                vm.attendeesSearch = '';
                
            }
            getAttendees();
        }
        //#endregion
    }
})();
