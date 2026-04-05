from django import forms
from .models import Submission

class FileUploadForm(forms.ModelForm):
    class Meta:
        model = Submission
        fields = ['file', 'model_name', 'model_type', 'visibility']
