export default function Footer() {
    return (
        <footer className="bg-success text-white text-center py-3 mt-auto">
            <p className="m-3">
                &copy; {new Date().getFullYear()} WORLD AQI.
            </p>
        </footer>
    );
}
