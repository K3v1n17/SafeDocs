"use client";

"use client";

import { useState } from 'react';
import { Upload, FileText, Shield, Link, Users } from 'lucide-react';

export default function Home() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    // Aquí iría la lógica de subida real con fetch/axios
    setTimeout(() => {
      setUploading(false);
      setFiles([]);
      alert('Documentos subidos con éxito');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">SecureVault</h1>
            </div>
            <nav className="flex space-x-6 items-center">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-800">Mis Documentos</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Enlaces Compartidos</a>
              <a href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Iniciar Sesión
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Título Principal */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Almacena tus documentos de forma segura
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sube, verifica y comparte tus documentos personales con control total de acceso
            y enlaces protegidos con expiración automática.
          </p>
        </div>

        {/* Zona de Subida */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Arrastra tus documentos aquí
                </h3>
                <p className="text-gray-600 mb-4">
                  o haz clic para seleccionar archivos
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Seleccionar Archivos
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Formatos soportados: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
              </p>
            </div>
          </div>

          {/* Lista de Archivos Seleccionados */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Archivos seleccionados ({files.length})
              </h4>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {uploading ? 'Subiendo...' : 'Subir Documentos'}
              </button>
            </div>
          )}
        </div>

        {/* Características de Seguridad */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Encriptación Segura
            </h3>
            <p className="text-gray-600">
              Todos tus documentos son encriptados con AES-256 antes de ser almacenados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Link className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enlaces Protegidos
            </h3>
            <p className="text-gray-600">
              Comparte documentos mediante enlaces seguros con expiración automática.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Control de Acceso
            </h3>
            <p className="text-gray-600">
              Gestiona quién puede ver tus documentos y por cuánto tiempo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}