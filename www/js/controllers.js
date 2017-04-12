angular.module('bookie.controllers', [])

  .controller('LoginCtrl', function($rootScope, $scope, $ionicViewSwitcher, $ionicModal, $state, $timeout) {
    // Form data for the login modal
    $scope.loginData = {};

    $scope.doLogin = function() {
      //TODO: Verify via Firebase
      firebase.auth().signInWithEmailAndPassword($scope.loginData.email, $scope.loginData.password)
        .then(function() {
          $ionicViewSwitcher.nextDirection('forward');
          $state.go('app.home');
        })
        .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
        });
    }
    $scope.onCreateAccount = function() {
      $scope.createAccount();
    }

    // Form data for the login modal
    $scope.createAccountData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/createAccount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.createAccountModal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeCreateAccount = function() {
      $scope.createAccountModal.hide();
    };

    // Open the login modal
    $scope.createAccount = function() {
      $scope.createAccountModal.show();
    };

    $scope.doCreateAccount = function() {
      //TODO: Verify via Firebase
      firebase.auth()
        .createUserWithEmailAndPassword($scope.createAccountData.email, $scope.createAccountData.password)
        .then(function() {
          //$ionicViewSwitcher.nextDirection('back');
          //$state.go('login');
          $timeout(function() {
            $scope.closeCreateAccount();
          }, 1000);
          $scope.loginData.email = $scope.createAccountData.email;
          $scope.loginData.password = $scope.createAccountData.password;
          $scope.doLogin();
          var user = firebase.auth().currentUser;
          user.updateProfile({
            displayName: $scope.createAccountData.username,
            photoURL: "http://i.ebayimg.com/images/g/aJUAAOSwT6pVw1wO/s-l300.jpg"
          }).then(function() {
            console.log("Update successful");
          }).catch(function(error) {
            alert(errorMessage);
            console.log(error);
          })

        })
        .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode == 'auth/weak-password') {
            alert('The password is too weak.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
        });
    }
  })

  .controller('AppCtrl', function($rootScope, $scope, $ionicModal, $ionicViewSwitcher, $timeout, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/logout.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.logoutModal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogout = function() {
      $scope.logoutModal.hide();
    };

    // Open the login modal
    $scope.logout = function() {
      $scope.logoutModal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogout = function() {
      console.log('Doing logout');
      //TODO: Verify via Firebase
      firebase.auth().signOut()
        .then(function() {
          //$ionicViewSwitcher.nextDirection('forward');
          $state.go('login');
          $timeout(function() {
            $scope.closeLogout();
          }, 1000);
        })
        .catch(function(error) {
          // Handle Errors here.
          var errorMessage = error.message;
          alert(errorMessage);
          console.log(error);
        });
    };
  })

  .controller('HomeCtrl', function($scope, $stateParams) {
    $scope.user = firebase.auth().currentUser;
    $scope.postData = {};
    $scope.doPost = function() {
      console.log('Doing post');
      firebase.database().ref('user/' + $scope.user.uid + '/public/posts/'
        + (Math.round(Date.now().getTime()) / 1000).toString()).set({
        message: $scope.postData.message
      });

    };

    $('textarea').each(function () {
      this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
    }).on('input', function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  })

  .controller('imageController', function($scope, $cordovaCamera, $cordovaFile) {
    //The scope array is used for our ng-repeat to store the links to the images
    $scope.images = [];

    $scope.addImage = function() {
      // The options array is passed to the cordovaCamera with specific options.
      // For more options see the official docs for cordova camera.
      var options = {
        destinationType : 'Camera.DestinationType.FILE_URI',
        sourceType : 'Camera.PictureSourceType.CAMERA', // Camera.PictureSourceType.PHOTOLIBRARY
        allowEdit : false,
        encodingType: 'Camera.EncodingType.JPEG',
        popoverOptions: 'CameraPopoverOptions',
      };

      // Call the ngCordova module cordovaCamera we injected to our controller
      $cordovaCamera.getPicture(options).then(function(imageData) {

        // When the image capture returns data, we pass the information to our success function,
        // which will call some other functions to copy the original image to our app folder.
        onImageSuccess(imageData);

        function onImageSuccess(fileURI) {
          createFileEntry(fileURI);
        }

        function createFileEntry(fileURI) {
          window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
        }

        // This function copies the original file to our app directory. As we might have to deal with duplicate images,
        // we give a new name to the file consisting of a random string and the original name of the image.
        function copyFile(fileEntry) {
          var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
          var newName = makeid() + name;

          window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(fileSystem2) {
              fileEntry.copyTo(
                fileSystem2,
                newName,
                onCopySuccess,
                fail
              );
            },
            fail);
        }

        // If the copy task finishes successful, we push the image url to our scope array of images.
        // Make sure to use the apply() function to update the scope and view!
        function onCopySuccess(entry) {
          $scope.$apply(function () {
            $scope.images.push(entry.nativeURL);
          });
        }

        function fail(error) {
          console.log("fail: " + error.code);
        }

        function makeid() {
          var text = "";
          var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

          for (var i=0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
          }
          return text;
        }

      }, function(err) {
        console.log(err);
      });
    }

    $scope.urlForImage = function(imageName) {
      var name = imageName.substr(imageName.lastIndexOf('/') + 1);
      var trueOrigin = cordova.file.dataDirectory + name;
      return trueOrigin;
    }
  })

  .controller('PlaylistCtrl', function($scope, $stateParams) {
  });
