class Cancelled(Exception):
    """El usuario canceló el trabajo."""


class PipelineError(Exception):
    """Error con un mensaje entendible para mostrar en la página."""
