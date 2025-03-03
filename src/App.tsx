/* eslint-disable no-case-declarations */
import React, { useState, useRef } from 'react';
import './App.css';

type Student = {
  nombre: string;
  codigo: string;
  fechaIngreso: string;
  direccion: string;
  telefonoFijo: string;
  telefonoCelular: string;
  correoElectronico: string;
};


type ValidationErrors = {
  [key in keyof Student]?: string;
};

// Expresiones regulares para validación
const regexPatterns = {
  nombre: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/,
  codigo: /^[1-9]\d{7}$/,
  fechaIngreso: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
  direccion: /^[A-Za-z0-9\s#\\-]+$/,
  telefonoFijo: /^6056\d{6}$/,
  telefonoCelular: /^3\d{9}$/,
  correoElectronico: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
};

const errorMessages = {
  nombre: "El nombre debe contener solo letras y espacios.",
  codigo: "El código debe tener 8 dígitos y no empezar con 0.",
  fechaIngreso: "El formato de fecha debe ser DD/MM/YYYY.",
  direccion: "La dirección solo puede contener letras, números, espacios, # y -.",
  telefonoFijo: "El teléfono fijo debe empezar con 6056 y tener 10 dígitos en total.",
  telefonoCelular: "El teléfono celular debe empezar con 3 y tener 10 dígitos en total.",
  correoElectronico: "Ingrese un correo electrónico válido."
};

function App() {
  const [formData, setFormData] = useState<Student>({
    nombre: '',
    codigo: '',
    fechaIngreso: '',
    direccion: '',
    telefonoFijo: '',
    telefonoCelular: '',
    correoElectronico: ''
  });


  const [students, setStudents] = useState<Student[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [activeTab, setActiveTab] = useState<'form' | 'data'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    validateField(name as keyof Student, value);
  };

  const validateField = (field: keyof Student, value: string): boolean => {
    const pattern = regexPatterns[field];
    const isValid = pattern.test(value);

    setErrors(prev => ({
      ...prev,
      [field]: isValid ? undefined : errorMessages[field]
    }));

    return isValid;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof Student>).forEach(key => {
      const value = formData[key];
      const fieldIsValid = regexPatterns[key].test(value);
      
      if (!fieldIsValid) {
        newErrors[key] = errorMessages[key];
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setStudents(prev => [...prev, { ...formData }]);
      
      setFormData({
        nombre: '',
        codigo: '',
        fechaIngreso: '',
        direccion: '',
        telefonoFijo: '',
        telefonoCelular: '',
        correoElectronico: ''
      });
      
      alert('Estudiante agregado correctamente');
      
      if (window.innerWidth < 768) {
        setActiveTab('data');
      }
    } else {
      alert('Por favor corrija los errores en el formulario');
    }
  };

  // Exportar datos
  const handleExport = (format: 'text' | 'excel' | 'xml' | 'json') => {
    if (students.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let content = '';
    let filename = `estudiantes.`;
    let mimeType = '';

    switch (format) {
      case 'text':
        content = students.map(student => 
          Object.values(student).join('\t')
        ).join('\n');
        filename += 'txt';
        mimeType = 'text/plain';
        break;
      
      case 'excel':
        const headers = Object.keys(students[0]).join(',');
        const rows = students.map(student => 
          Object.values(student).join(',')
        ).join('\n');
        content = `${headers}\n${rows}`;
        filename += 'csv';
        mimeType = 'text/csv';
        break;
      
      case 'xml':
        content = '<?xml version="1.0" encoding="UTF-8"?>\n<students>\n';
        students.forEach(student => {
          content += '  <student>\n';
          Object.entries(student).forEach(([key, value]) => {
            content += `    <${key}>${value}</${key}>\n`;
          });
          content += '  </student>\n';
        });
        content += '</students>';
        filename += 'xml';
        mimeType = 'application/xml';
        break;
      
      case 'json':
        content = JSON.stringify(students, null, 2);
        filename += 'json';
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importar datos
  const handleImport = (format: 'text' | 'excel' | 'xml' | 'json') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = format === 'text' ? '.txt' :
                                  format === 'excel' ? '.csv' :
                                  format === 'xml' ? '.xml' : '.json';
      fileInputRef.current.click();
    }
  };

  // Procesar archivo importado
  const processImportedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        let importedStudents: Student[] = [];
        const format = file.name.split('.').pop() as 'txt' | 'csv' | 'xml' | 'json';
        
        switch (format) {
          case 'txt':
            importedStudents = content.trim().split('\n').map(line => {
              const [nombre, codigo, fechaIngreso, direccion, telefonoFijo, telefonoCelular, correoElectronico] = line.split('\t');
              return { nombre, codigo, fechaIngreso, direccion, telefonoFijo, telefonoCelular, correoElectronico };
            });
            break;
          
          case 'csv':
            const lines = content.trim().split('\n');
            const headers = lines[0].split(',') as Array<keyof Student>;
            importedStudents = lines.slice(1).map(line => {
              const values = line.split(',');
              const student = {} as Student;
              headers.forEach((header, index) => {
                student[header] = values[index];
              });
              return student;
            });
            break;
          
          case 'xml':
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, "text/xml");
            const studentNodes = xmlDoc.getElementsByTagName("student");
            
            for (let i = 0; i < studentNodes.length; i++) {
              const studentNode = studentNodes[i];
              const student = {} as Student;
              
              (Object.keys(formData) as Array<keyof Student>).forEach(key => {
                const element = studentNode.getElementsByTagName(key)[0];
                if (element) {
                  student[key] = element.textContent || '';
                }
              });
              
              importedStudents.push(student);
            }
            break;
          
          case 'json':
            importedStudents = JSON.parse(content);
            break;
        }
        
        setStudents(prev => [...prev, ...importedStudents]);
        alert(`Se importaron ${importedStudents.length} estudiantes`);
      } catch (error) {
        console.error("Error al importar:", error);
        alert("Error al importar el archivo. Verifique el formato.");
      }
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  // Renderizado condicional para vista móvil
  const renderMobileView = () => {
    return (
      <>
        <div className="mobile-tabs">
          <button 
            className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Formulario
          </button>
          <button 
            className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Datos ({students.length})
          </button>
        </div>
        
        {activeTab === 'form' ? renderFormSection() : renderDataSection()}
      </>
    );
  };

  const renderDesktopView = () => {
    return (
      <>
        {renderFormSection()}
        {renderDataSection()}
      </>
    );
  };

  const renderFormSection = () => {
    return (
      <section className="form-section">
        <h2>Formulario de Registro</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo:</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="codigo">Código de Estudiante:</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className={errors.codigo ? 'error' : ''}
            />
            {errors.codigo && <span className="error-message">{errors.codigo}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="fechaIngreso">Fecha de Ingreso (DD/MM/YYYY):</label>
            <input
              type="text"
              id="fechaIngreso"
              name="fechaIngreso"
              value={formData.fechaIngreso}
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
              className={errors.fechaIngreso ? 'error' : ''}
            />
            {errors.fechaIngreso && <span className="error-message">{errors.fechaIngreso}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="direccion">Dirección:</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className={errors.direccion ? 'error' : ''}
            />
            {errors.direccion && <span className="error-message">{errors.direccion}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="telefonoFijo">Teléfono Fijo:</label>
            <input
              type="text"
              id="telefonoFijo"
              name="telefonoFijo"
              value={formData.telefonoFijo}
              onChange={handleChange}
              placeholder="6056XXXXXX"
              className={errors.telefonoFijo ? 'error' : ''}
            />
            {errors.telefonoFijo && <span className="error-message">{errors.telefonoFijo}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="telefonoCelular">Teléfono Celular:</label>
            <input
              type="text"
              id="telefonoCelular"
              name="telefonoCelular"
              value={formData.telefonoCelular}
              onChange={handleChange}
              placeholder="3XXXXXXXXX"
              className={errors.telefonoCelular ? 'error' : ''}
            />
            {errors.telefonoCelular && <span className="error-message">{errors.telefonoCelular}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="correoElectronico">Correo Electrónico:</label>
            <input
              type="text"
              id="correoElectronico"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleChange}
              className={errors.correoElectronico ? 'error' : ''}
            />
            {errors.correoElectronico && <span className="error-message">{errors.correoElectronico}</span>}
          </div>
          
          <button type="submit" className="submit-btn">Registrar Estudiante</button>
        </form>
      </section>
    );
  };

  // Renderizar sección de datos
  const renderDataSection = () => {
    return (
      <section className="data-section">
        <h2>Estudiantes Registrados</h2>
        {students.length === 0 ? (
          <p>No hay estudiantes registrados.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Dirección</th>
                  <th>Tel. Fijo</th>
                  <th>Celular</th>
                  <th>Correo</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.nombre}</td>
                    <td>{student.codigo}</td>
                    <td>{student.fechaIngreso}</td>
                    <td>{student.direccion}</td>
                    <td>{student.telefonoFijo}</td>
                    <td>{student.telefonoCelular}</td>
                    <td>{student.correoElectronico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="export-import-section">
          <div className="export-section">
            <h3>Exportar Datos</h3>
            <div className="button-group">
              <button onClick={() => handleExport('text')}>Texto (.txt)</button>
              <button onClick={() => handleExport('excel')}>Excel (.csv)</button>
              <button onClick={() => handleExport('xml')}>XML</button>
              <button onClick={() => handleExport('json')}>JSON</button>
            </div>
          </div>
          
          <div className="import-section">
            <h3>Importar Datos</h3>
            <div className="button-group">
              <button onClick={() => handleImport('text')}>Texto (.txt)</button>
              <button onClick={() => handleImport('excel')}>Excel (.csv)</button>
              <button onClick={() => handleImport('xml')}>XML</button>
              <button onClick={() => handleImport('json')}>JSON</button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={processImportedFile}
            />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Registro de Estudiantes</h1>
      </header>
      
      <main>
        {/* Usar renderizado condicional basado en tamaño de pantalla */}
        {window.innerWidth < 768 ? renderMobileView() : renderDesktopView()}
      </main>
    </div>
  );
}

export default App;