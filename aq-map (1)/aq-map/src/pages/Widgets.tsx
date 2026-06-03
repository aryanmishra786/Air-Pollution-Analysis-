import React from "react";
import AQIWidgetWithChart from "./AQIWidget";

const Widgets: React.FC = () => {
    const cities = ["Riyadh","Kuwait City","Beijing","Hanoi","Jakarta","Delhi","Manila","Wuhan","Manama","Dhaka","Milan","Shanghai","Kinshasa","Seoul","Chiang Mai","Karachi","Chengdu","Baghdad","Lahore","Bangkok","Cairo","Tel Aviv","Incheon","Dubai","Medan"," North Sumatra","London"," England","Kathmandu","Paris","Chongqing","Busan","Munich","Jerusalem","Kolkata","Hangzhou","Almaty","Addis Adaba","Rotterdam","Ulaanbaatar","Taipei","Belgrade","Wroclaw","Mumbai","Batam"," Riau Islands","Guangzhou","Birmingham"," England","Phnom Penh","Algiers","Zagreb","Osaka","Doha","Brussels","Johannesburg","Accra","Sarajevo","Tehran","Ljubljana","Kobe","Hong Kong","Shenzhen","Dublin","Tokyo","Amsterdam","Warsaw","Kyoto","Detroit"," Michigan","Minneapolis"," Minnesota","Santiago","Bratislava","Krakow","Istanbul","Barcelona","Tashkent","Kampala","Lima","Yangon","Lisboa","Rome","Prague","Nairobi","Dakar"];

    return (
        <div>
            <h5 style={{textAlign:"center"}}>Major Cities Weather</h5>

            <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-start",
                gap: "20px",
                padding: "20px",
            }}
        >
            {cities.map((city) => (
                <AQIWidgetWithChart city={city} token="ea3137a2f00c51d428823556788e96b5a2ca2d40" refreshMinutes={10} />
            ))}

        </div>
        </div>

    );
};

export default Widgets;
