"use strict";

/* JShint config settings */
/* jshint -W097 */
/* global angular, $ */

var app = angular.module('PhotoSave', []);

app.constant('config', {
  appId: 'XCZD_i_hP9q0VH8haeM7UnEjhUihNj_Z6bFefaEdXsENUWjv',
  baseUrl: 'https://api.kloudless.com/v0'
});

app.config([
  '$compileProvider',
  function( $compileProvider ) {
    var currentImgSrcSanitizationWhitelist = $compileProvider.imgSrcSanitizationWhitelist();
    var newImgSrcSanitizationWhiteList = currentImgSrcSanitizationWhitelist.toString().slice(0,-1)
    + '|chrome-extension:'
    +currentImgSrcSanitizationWhitelist.toString().slice(-1);

    // console.log("Changing imgSrcSanitizationWhiteList from "+currentImgSrcSanitizationWhitelist+" to "+newImgSrcSanitizationWhiteList);
    $compileProvider.imgSrcSanitizationWhitelist(newImgSrcSanitizationWhiteList);
  }
]);

app.controller('ConfigCtrl', [
'$scope',
'$q',
'$timeout',
function($scope, $q, $timeout){

  $scope.services = [];

  $scope.serviceList = {
    'dropbox':   {img: 'img/dropbox.png'},
    'box':       {img: 'img/box.png'},
    'gdrive':    {img: 'img/gdrive.png'},
    'skydrive':  {img: 'img/skydrive.png'},
    'sharefile': {img: 'img/sharefile.png'},
    'copy':      {img: 'img/copy.png'},
    'sugarsync': {img: 'img/sugarsync.png'},
    'bitcasa':   {img: 'img/bitcasa.png'},
    'egnyte':    {img: 'img/egnyte.png'}
  };

  chrome.storage.local.get('services', function (res) {
    if (res.services) {
      console.log('Loading... ', res.services);

      $timeout(function(){angular.copy(res.services, $scope.services);});
    } else { console.log("No user..."); }

  });

  $scope.saveServices = function(cb){
    console.log("saving state: ", $scope.services);

    chrome.storage.local.set({'services': $scope.services}, cb || function(){});
  };


  $scope.unlinkAccount = function(id){
    console.log(id)
    $scope.services.splice(id, 1);
    $scope.saveServices();
  };



  // debugging purposes
  $scope.clearStorage = function(){
    angular.copy([], $scope.services);
    chrome.storage.local.clear();
  }

}]);



app.directive('authenticator', [
'$http',
'$timeout',
'config',
function($http, $timeout, config){
  return {
    restrict: 'A',
    scope: {
      services: '=',
      serviceList: '=',
      save: '&'
    },
    link: function(scope, elem, attrs) {

      chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
        if(tab.url.search(/^https:\/\/api\.kloudless\.com\/services\/\w+\/callback/) === -1
          || changeInfo.status !== 'complete')
          return;


        chrome.tabs.executeScript(tabId, {
          file: "js/get-auth-info.js"
        }, function(result){
          chrome.tabs.remove(tabId);

          result = result[0];

          if(scope.services.some(function(e){
            return e.name === result.service
          })){
            console.log("Already Authed to that service")
          } else {

            $timeout(function(){
              var s = {
                name: result.service,
                id: result.account,
                apiKey: result.account_key,
                enabled: true
              }
              scope.services.push(s);

              // Create kloudless folder
              $http.post(config.baseUrl + '/accounts/'+s.id+'/folders/',
                {
                  "parent_id": "root",
                  "name": "photo_save"
                },
                {
                  headers: {
                    Authorization: 'AccountKey ' + s.apiKey
                  }
                }
                ).then(function(res){
                  console.log("Folder kloudless created")
                  console.log(res.data)
                  scope.services[scope.services.length-1].folder_id = res.data.id;
                  scope.save();
                });
            });
          }
        });
      });

      elem.bind('click', function(){

        // Calculate which services to allow user to auth against
        var services = _.difference(
          Object.keys(scope.serviceList),
          scope.services.map(function(s){return s.name})
          ).join(",");

        var url = "https://api.kloudless.com/services/?app_id="+config.appId
                  + "&retrieve_account_key=1"
                  + "&services=" + services;

        console.log(scope.serviceList)
        chrome.windows.create({
          url: url,
          type: 'popup',
          width: 1000,
          height: 600
        });

      });
    }
  };
}]);











