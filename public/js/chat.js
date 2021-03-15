const socket = io()

// ELements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationUrlTemplate = document.querySelector('#location-url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (messageObject) => {
    console.log(messageObject)
    const html = Mustache.render(messageTemplate, {
        username: messageObject.username,
        message: messageObject.text,
        createdAt: moment(messageObject.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (urlObject) => {
    const html = Mustache.render(locationUrlTemplate, {
        username: urlObject.username,
        url: urlObject.url,
        createdAt: moment(urlObject.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', e => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', true)
    socket.emit('sendMessage', e.target.elements.message.value, (message) => {
        console.log(message)
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageForm.focus()
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', true)
    if (!navigator.geolocation) {
        $locationButton.removeAttribute('disabled')
        return alert('Geolocation is not supported')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        socket.emit('sendLocation', { latitude, longitude }, (error) => {
            $locationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})


