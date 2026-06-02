import './welcome.css'

export default function Welcome() {
    return (
        <div className="welcome">
            <div className= "welcome-message">
                <h2>Bienvenido a </h2>
                <h1>SmartVisionHub</h1>
                <p>Tu plataforma de visión por computadora</p>
                <p> Entrena, prueba y monitorea tus modelos</p>    
            </div>

            <div className = "welcome-actions">
                <button className="welcome_button">Inferencia</button>
                <button className="welcome_button">Configuracion</button>
                <button className="welcome_button">Monitor MlFLow</button>
            </div>
        
        </div>


        )
    }