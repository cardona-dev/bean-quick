<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\SolicitudEmpresa;

class ActivacionEmpresaMail extends Mailable
{
    use Queueable, SerializesModels;

    // Estas propiedades públicas estarán disponibles automáticamente en la vista
    public $solicitud;
    public $link;

    /**
     * Crear una nueva instancia del mensaje.
     * * @param SolicitudEmpresa $solicitud El objeto con los datos de la empresa aprobada.
     * @param string $link El enlace generado con el token de activación.
     */
    public function __construct(SolicitudEmpresa $solicitud, string $link)
    {
        $this->solicitud = $solicitud;
        $this->link = $link;
    }

    /**
     * Construir el mensaje.
     * * Configura el asunto y vincula la plantilla HTML personalizada.
     */
    public function build()
    {
        return $this
            ->subject('Activación de cuenta — BeanQuick')
            // Se usa view() para cargar el archivo en resources/views/emails/activacion_empresa.blade.php
            ->view('emails.activacion_empresa'); 
    }
}