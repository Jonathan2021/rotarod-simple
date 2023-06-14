$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();

        var CorporateAccount = $('#CorporateAccount').val();
        var Password = $('#Password').val();

        // Debug: Print the captured values to the console
        console.log('CorporateAccount: ', CorporateAccount);
        console.log('Password: ', Password);

        $.post('/auth/login', {
            CorporateAccount: CorporateAccount,
            Password: Password
        }, function(data, status) {
            if (status === 'success') {
                // Handle successful login, e.g. redirect to the main page
                window.location.href = '/main.html';
            } else {
                // Handle failed login, e.g. show an error message
                alert('Login failed. Please try again.');
            }
        });
    });
});
