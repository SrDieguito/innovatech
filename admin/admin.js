import { useEffect, useState } from "react";

export default function AdminPanel() {
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        fetch('/api/getUsers?estado=pendiente')
            .then(res => res.json())
            .then(data => setUsuarios(data));
    }, []);

    const actualizarEstado = async (id, estado) => {
        await fetch('/api/updateUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, estado })
        });
        setUsuarios(usuarios.filter(user => user.id !== id));
    };

    return (
        <div>
            <h1>Panel de Administración</h1>
            {usuarios.map(user => (
                <div key={user.id}>
                    <p><strong>Nombre:</strong> {user.nombre}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <button onClick={() => actualizarEstado(user.id, "aprobado")}>Aprobar</button>
                    <button onClick={() => actualizarEstado(user.id, "rechazado")}>Rechazar</button>
                    <hr />
                </div>
            ))}
        </div>
    );
}
