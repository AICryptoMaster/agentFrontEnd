import moment from 'moment';

export const formatTime = (timestamp) => {
    return moment(new Date(timestamp)).format('MM-DD')
}

export const formatTime2Second = (timestamp) => {
    return moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss')
}

export const formatTimeWithoutYear = (timestamp) => {
    return moment(new Date(timestamp)).format('MM/DD HH:mm')
}