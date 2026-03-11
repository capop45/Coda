document.addEventListener('DOMContentLoaded', () => {
  const docTitle = document.getElementById('docTitle');
  const docContent = document.getElementById('docContent');
  const templateStyle = document.getElementById('templateStyle');
  const imageUpload = document.getElementById('imageUpload');
  const imageList = document.getElementById('imageList');
  const themeToggle = document.getElementById('themeToggle');
  
  const printArea = document.getElementById('printArea');
  const previewTitle = document.getElementById('previewTitle');
  const previewDate = document.getElementById('previewDate');
  const previewContent = document.getElementById('previewContent');

  const btnGenerateAI = document.getElementById('btnGenerateAI');
  const btnPrintPDF = document.getElementById('btnPrintPDF');
  const btnClear = document.getElementById('btnClear');

  let uploadedImages = [];

  // Atualiza a pré-visualização em tempo real
  function updatePreview() {
    previewTitle.textContent = docTitle.value || 'Documento Sem Título';
    previewDate.textContent = new Date().toLocaleDateString('pt-BR');
    
    // Atualiza classes de estilo
    printArea.className = `print-area container py-4 ${templateStyle.value}`;

    // Converte o Markdown do textarea para HTML
    let htmlContent = marked.parse(docContent.value || '');
    
    // Injeta as imagens no final (ou você pode evoluir para injetar via tags customizadas)
    if (uploadedImages.length > 0) {
      htmlContent += '<hr><h3>Anexos</h3>';
      uploadedImages.forEach(img => {
        htmlContent += `<img src="${img.src}" alt="${img.name}" style="max-width: 100%; margin-bottom: 20px;">`;
      });
    }

    previewContent.innerHTML = htmlContent;
  }

  // Manipulação de Imagens
  imageUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages.push({
          name: file.name,
          src: event.target.result
        });
        updateImageList();
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  });

  function updateImageList() {
    imageList.innerHTML = uploadedImages.map((img, index) => 
      `<div>📎 ${img.name} <button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="removeImage(${index})">Remover</button></div>`
    ).join('');
  }

  window.removeImage = function(index) {
    uploadedImages.splice(index, 1);
    updateImageList();
    updatePreview();
    // Limpa o input file para permitir re-upload
    imageUpload.value = '';
  }

  // Chamada para o Backend (Gemini)
  btnGenerateAI.addEventListener('click', async () => {
    const prompt = docContent.value.trim();
    if (!prompt) {
      alert('Por favor, insira algum contexto ou instruções no campo de conteúdo.');
      return;
    }

    btnGenerateAI.disabled = true;
    btnGenerateAI.textContent = '⏳ Gerando...';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: docTitle.value,
          prompt: prompt
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Adiciona a resposta da IA ao conteúdo existente (ou substitui, como preferir)
        docContent.value = data.content;
        updatePreview();
      } else {
        alert(`Erro: ${data.error || 'Falha na comunicação com o servidor.'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com o servidor.');
    } finally {
      btnGenerateAI.disabled = false;
      btnGenerateAI.textContent = '✨ Gerar Texto com IA';
    }
  });

  // Exportar PDF usando a caixa de diálogo de impressão nativa do navegador
  btnPrintPDF.addEventListener('click', () => {
    updatePreview();
    window.print();
  });

  // Limpar Tudo
  btnClear.addEventListener('click', () => {
    if(confirm('Tem certeza que deseja limpar todo o documento?')) {
      docTitle.value = '';
      docContent.value = '';
      uploadedImages = [];
      updateImageList();
      updatePreview();
    }
  });

  // Alternar Tema Escuro
  themeToggle.addEventListener('click', () => {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'dark') {
      body.removeAttribute('data-theme');
      themeToggle.textContent = 'Modo Escuro';
    } else {
      body.setAttribute('data-theme', 'dark');
      themeToggle.textContent = 'Modo Claro';
    }
  });

  // Listeners para atualizar preview em tempo real
  docTitle.addEventListener('input', updatePreview);
  docContent.addEventListener('input', updatePreview);
  templateStyle.addEventListener('change', updatePreview);

  // Inicializa o preview
  updatePreview();
});
