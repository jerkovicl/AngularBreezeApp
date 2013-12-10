(function () {
    'use strict';

    // Controller name is handy for logging
    var controllerId = 'sessions';

    // Define the controller on the module.
    // Inject the dependencies. 
    // Point to the controller definition function.
    angular.module('app').controller(controllerId,
        ['$routeParams', 'common', 'config', 'datacontext', sessions]);

    function sessions($routeParams, common, config, datacontext) {
        // Using 'Controller As' syntax, so we assign this to the vm variable (for viewmodel).
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        // Bindable properties and functions are placed on vm.
        
        //put sessions in property
        vm.filteredSessions = [];
        vm.search = search;
        vm.sessionsSearch = $routeParams.search || '';
        vm.sessionsFilter = sessionsFilter;
        vm.sessions = [];
        vm.title = 'Sessions';
        vm.refresh = refresh; //bounds to button on view cause of ng-click
        activate();

        function activate() {
            //get our sessions
            
            common.activateController([getSessions()], controllerId) //parameter for refresh is false
                .then(function () {
                    // createSearchThrottle uses values by convention, via its parameters:
                    //      vm.sessionsSearch is where the users enters the search
                    //      vm.sessions is the original unfiltered array
                    //      vm.filteredSessions is the filtered array
                    //      vm.sessionsFilter is the filtering function

                    applyFilter = common.createSearchThrottle(vm, 'sessions');
                    if (vm.sessionsSearch) { applyFilter(true);}
                    log('Activated Session View');
                });
        }
        function getSessions(forceRefresh) {
            return datacontext.getSessionPartials(forceRefresh).then(function (data) {
                return vm.sessions = vm.filteredSessions = data;
            });
        }

        function refresh() {
            getSessions(true);
        }

        function search($event) {
            if ($event.keyCode === keyCodes.esc) {
                vm.sessionsSearch = '';
                applyFilter(true);
            }
            else {
                applyFilter();
            }
        }

        function applyFilter() {
            
        }

        function sessionsFilter(session) {
            var textContains = common.textContains;
            var searchText = vm.sessionsSearch;
            var isMatch = searchText ? textContains(session.title, searchText) || textContains(session.tagsFormatted, searchText)
                || textContains(session.room.name, searchText)
                || textContains(session.track.name, searchText)
                || textContains(session.speaker.fullName, searchText)
            : true;
            return isMatch;
        }
        //#region Internal Methods        

        //#endregion
    }
})();
