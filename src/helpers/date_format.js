export const formatHour = (date) => {
    return date;
}

export const formatDay = (date) =>
    new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date));

export const formatMonth = (yearMonth) => {
    const [year, month] = yearMonth.split("-");
    return new Intl.DateTimeFormat("es-PE", {
        month: "short",
        year: "numeric"
    }).format(new Date(year, month - 1));
};