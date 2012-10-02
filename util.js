module.eports = {
      handleError: function(err) {
        if (!(err instanceof Error)) {
          err = new Error(err);
        }
        if (err.message.indexOf('token not found, expired or invalid') !== -1) {
          //$.removeCookie('Authorization');
        } else {
          throw err;
        }
      }
}
