$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();

        var Corporate_Account = $('#Corporate_Account').val();
        var Password = $('#Password').val();

        $.post('http://localhost:3000/auth/login', {
            Corporate_Account: Corporate_Account,
            Password: Password
        }, function(data, status) {
            if (status === 'success') {
                // Handle successful login, e.g. redirect to the main page
                window.location.href = 'main.html';
            } else {
                // Handle failed login, e.g. show an error message
                alert('Login failed. Please try again.');
            }
        });
    });
});

