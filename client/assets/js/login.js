$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();

        var CorporateAccount = $('#CorporateAccount').val();
        var Password = $('#Password').val();

        $.post('/auth/login', {
            CorporateAccount: CorporateAccount,
            Password: Password
        }, function(data, status) {
            if (status === 'success' && data.displayName) {
                // Handle successful login, e.g. redirect to the main page
                window.location.href = '/main';
            } else {
                // Handle failed login, e.g. show an error message and clear password field
                $('#login-error').text('Login failed. Please try again.');
                $('#Password').val('');
            }
        }).fail(function() {
            // Handle failed request, e.g. server error
            $('#login-error').text('Login failed. Please try again.');
            $('#Password').val('');
        });
    });
});