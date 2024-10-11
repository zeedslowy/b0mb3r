const phoneInput = document.querySelector('#phone');
const serviceCount = document.querySelector('#serviceCount');

let intlTelInput;
let progressBar;

const countryPlaceholders = {
    tr: '90 544 909 6348',
    be: '32 000 000',
    de: '49 000 000',
    gb: '44 759 960 8079',
    custom: '1 202-555-0135',
};

let attackId = '';

document.addEventListener('DOMContentLoaded', () => {
    window.intlTelInputGlobals.getCountryData().push({
        name: 'en',
        iso2: 'gb',
        dialCode: '',
        priority: 0,
        areaCodes: null,
    });
    intlTelInput = window.intlTelInput(phoneInput, {
        onlyCountries: [
            'tr',
            'be',
            'de',
            'gb',
            'custom',
        ],
        initialCountry: 'gb',
        separateDialCode: true,
    });

    progressBar = new ProgressBar.Circle(document.querySelector('#loader'), {
        strokeWidth: 12,
        color: '#dc3545',
        trailColor: '#eee',
        trailWidth: 12,
        svgStyle: null,
    });
});

phoneInput.addEventListener('countrychange', async () => {
    const countResponse = await fetch(`/services/count?country_code=${intlTelInput.getSelectedCountryData().dialCode}`, {
        method: 'GET',
    });
    const content = await countResponse.json();
    serviceCount.innerHTML = content.count;

    phoneInput.placeholder = countryPlaceholders[intlTelInput.getSelectedCountryData().iso2];
});

document.querySelector('#main-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    setTimeout(() => document.querySelector('#block-ui').style.display = 'block', 850);
    setTimeout(() => document.querySelector('.stop').style.display = 'block', 850);
    blurDocument();
    document.querySelector('#loader').style.cssText = `
        animation: fadeIn;
        animation-duration: 850ms;
        animation-fill-mode: both;
    `;
    document.querySelector('.stop').style.cssText = `
        animation: fadeIn;
        animation-duration: 850ms;
        animation-fill-mode: both;
    `;

    const phone = intlTelInput.getSelectedCountryData().dialCode + document.querySelector('#phone').value;

    const response = await fetch('/attack/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            number_of_cycles: document.querySelector('#count').value,
            phone: phone,
        }),
    });

    const attackResponse = await response.json();
    attackId = attackResponse.id;

    const interval = setInterval(async () => {
        const response = await fetch(`/attack/${attackResponse.id}/status`, {
            method: 'GET',
        });
        const statusResponse = await response.json();

        try {
            progressBar.animate(100 / statusResponse.end_at * statusResponse.currently_at / 100, {
                duration: 250,
            });
        } catch (e) {}

        if (statusResponse.currently_at >= statusResponse.end_at) {
            clearInterval(interval);
            setTimeout(() => document.querySelector('#block-ui').style.display = 'none', 850);
            setTimeout(() => document.querySelector('.stop').style.display = 'none', 850);
            unblurDocument();
            document.querySelector('#loader').style.cssText = `
                animation: fadeOut;
                animation-duration: 850ms;
                animation-fill-mode: both;
            `;
            document.querySelector('.stop').style.cssText = `
                animation: fadeOut;
                animation-duration: 850ms;
                animation-fill-mode: both;
            `;

            attackId = '';
        }
    }, 500);
});

document.querySelector('.stop').addEventListener('click', async () => {
    if (!attackId.length) return;

    await fetch(`/attack/${attackId}/stop`, {
        method: 'POST',
    });
});

const blurDocument = () => {
    const cssText = `
        animation: blur;
        animation-duration: 850ms;
        animation-fill-mode: both;
    `;
    document.querySelector('main').style.cssText = document.querySelector('footer').style.cssText = cssText;
}

const unblurDocument = () => {
    const cssText = `
        animation: blur;
        animation-duration: 850ms;
        animation-fill-mode: both;
        animation-direction: reverse;
    `;
    document.querySelector('main').style.cssText = document.querySelector('footer').style.cssText = cssText;
}
