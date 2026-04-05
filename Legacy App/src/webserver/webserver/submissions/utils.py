from django.core.exceptions import ValidationError
import os

def validate_file_extension(file):
    valid_extensions = ['.mat', '.m']
    extension = os.path.splitext(file.name)[1]
    if extension.lower() not in valid_extensions:
        raise ValidationError('File not supported. Please upload a MATLAB (.mat or .m) file.')