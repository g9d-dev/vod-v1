/**
 * Upload Login Or Register Request.
 * @param {Object} data 
 * @param {String} method 
 * @param {Function} callback function(isSuceeded)
 */
function handleUserUpdate(data, method, callback){
    $.ajax({
        url: '/users/'+method,
        type: 'post',
        data: data,
        dataType: 'json',
        success: callback.bind(data, true),
        error: callback.bind(data, false)
    });
}