(function(){
    let currentQuestion = 0;
    let score = 0;
    let timer;
    let questions = [];
    let userData = {};
    let isQuizActive = false;

    // Validasi waktu akses
    function validateAccess() {
        const now = new Date();
        const startTime = new Date('2024-09-03T10:00:00');
        const endTime = new Date('2024-09-03T10:30:00');

        if (now < startTime || now > endTime) {
            alert('Akses kuis hanya tersedia pada 3 September 2024 pukul 10:00 - 10:30.');
            return false;
        }
        return true;
    }

    // Cek akses ganda
    function checkDuplicateAccess(fullname, nim, angkatan) {
        const accessKey = `${fullname}_${nim}_${angkatan}`;
        if (localStorage.getItem(accessKey)) {
            alert('Anda sudah mengakses kuis ini sebelumnya.');
            return false;
        }
        localStorage.setItem(accessKey, 'true');
        return true;
    }

    // Fullscreen functions
    function enterFullscreen(element) {
        if(element.requestFullscreen) {
            element.requestFullscreen();
        } else if(element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if(element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if(element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    function handleFullscreenChange() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            if (isQuizActive) {
                alert("Mohon tetap dalam mode fullscreen selama kuis berlangsung.");
                enterFullscreen(document.documentElement);
            }
        }
    }

    function exitFullscreen() {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if(document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    function preventExitFullscreen(event) {
        if (isQuizActive && (event.key === 'Escape' || event.keyCode === 27)) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            enterFullscreen(document.documentElement);
        }
    }
    // Quiz functions
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startQuiz() {
        if (!validateAccess()) return;

        userData.fullname = document.getElementById('fullname').value;
        userData.nim = document.getElementById('nim').value;
        userData.angkatan = document.getElementById('angkatan').value;

        if (!userData.fullname || !userData.nim || !userData.angkatan) {
            alert('Mohon isi semua data diri.');
            return;
        }

        if (!checkDuplicateAccess(userData.fullname, userData.nim, userData.angkatan)) return;

        isQuizActive = true;
        enterFullscreen(document.documentElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        document.getElementById('registration-form').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');

        shuffleArray(questions);
        questions.forEach(q => shuffleArray(q.choices));

        showQuestion();
    }

    function showQuestion() {
        if (currentQuestion >= questions.length) {
            endQuiz();
            return;
        }

        const question = questions[currentQuestion];
        document.getElementById('question').textContent = question.question;
        document.getElementById('current-question').textContent = currentQuestion + 1;
        document.getElementById('total-questions').textContent = questions.length;

        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = '';
        question.choices.forEach((choice, index) => {
            const option = document.createElement('div');
            option.classList.add('option');
            option.textContent = choice;
            option.onclick = () => selectOption(index);
            optionsContainer.appendChild(option);
        });

        document.getElementById('progress').style.width = `${(currentQuestion + 1) / questions.length * 100}%`;

        startTimer();
    }

    function selectOption(index) {
        const options = document.querySelectorAll('.option');
        options.forEach(option => option.classList.remove('selected'));
        options[index].classList.add('selected');
    }

    function submitAnswer() {
        const selectedOption = document.querySelector('.option.selected');
        if (selectedOption) {
            const answer = selectedOption.textContent;
            if (answer === questions[currentQuestion].answer) {
                score += 5;
            }
        }

        currentQuestion++;
        clearInterval(timer);
        showQuestion();
    }

    function startTimer() {
        let timeLeft = 30;
        document.getElementById('timer').textContent = `Waktu: ${timeLeft}`;

        timer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer').textContent = `Waktu: ${timeLeft}`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                submitAnswer();
            }
        }, 1000);
    }

    function endQuiz() {
        isQuizActive = false;
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('result-container').classList.remove('hidden');
        document.getElementById('score').textContent = score;

        let resultMessage = '';
        if (score >= 65) {
            resultMessage = 'Selamat! Anda Bisa Mengikuti Praktikum.';
        } else {
            resultMessage = 'ANDA TIDAK BERHAK MENGIKUTI PRAKTIKUM HARI INI.';
        }
        document.getElementById('result-message').textContent = resultMessage;

        sendResultToGoogleSheet(userData.fullname, userData.nim, score);

        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('start-btn').addEventListener('click', startQuiz);
        document.getElementById('submit-btn').addEventListener('click', submitAnswer);
        document.getElementById('exit-fullscreen').addEventListener('click', function() {
            isQuizActive = false;
            exitFullscreen();
        });
    });

    // Prevent shortcuts and right-click
    window.blockShortcuts = function(e) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
            e.preventDefault();
            return false;
        }
    };

    document.oncontextmenu = function(e) {
        e.preventDefault();
        return false;
    };

    // Prevent back function
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };


// Prevent back function
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};

// Tambahkan fungsi sendResultToGoogleSheet di sini
function sendResultToGoogleSheet(fullName, nim, score) {
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbyAhd57b2t_OUTL104DxVE6e4vqNZV3EMyDOzElZEnLRXVqXAAAyA1bDJ_3Cds3_i8V/exec';
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS

  const data = {
    fullName: fullName,
    nim: nim,
    score: score,
    date: date,
    time: time
  };

  fetch(webAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    console.log('Data berhasil dikirim ke Google Sheet');
    console.log('Data yang dikirim:', JSON.stringify(data));
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

    // Quiz questions
    questions = [
  {
    "question": "Apa fungsi utama dari kunci primer (primary key) dalam sebuah tabel?",
    "choices": ["Untuk mengenkripsi data", "Untuk mengindeks seluruh kolom", "Untuk mengidentifikasi secara unik setiap baris dalam tabel", "Untuk mengurutkan data secara otomatis", "Untuk membatasi jumlah baris dalam tabel"],
    "answer": "Untuk mengidentifikasi secara unik setiap baris dalam tabel"
  },
  {
    "question": "Tipe data apa yang paling tepat untuk menyimpan angka desimal dalam Microsoft Access?",
    "choices": ["Integer", "Text", "Currency", "Long Integer", "Double"],
    "answer": "Double"
  },
  {
    "question": "Bagaimana cara tercepat untuk membuat daftar drop-down dalam sebuah kolom di Microsoft Access?",
    "choices": ["Menggunakan Macro", "Membuat Query", "Menggunakan Lookup Wizard", "Membuat Form", "Menggunakan VBA"],
    "answer": "Menggunakan Lookup Wizard"
  },
  {
    "question": "Apa yang dimaksud dengan mengindeks kolom dalam Microsoft Access?",
    "choices": ["Mengurutkan data dalam kolom", "Membuat kolom menjadi kunci primer", "Meningkatkan kecepatan pencarian dan pengurutan data", "Menambahkan deskripsi ke kolom", "Mengenkripsi data dalam kolom"],
    "answer": "Meningkatkan kecepatan pencarian dan pengurutan data"
  },
  {
    "question": "Berapa banyak kunci primer yang dapat dimiliki oleh sebuah tabel?",
    "choices": ["Tidak ada", "Satu", "Dua", "Tiga", "Tidak terbatas"],
    "answer": "Satu"
  },
  {
    "question": "Apa fungsi dari aturan validasi data dalam Microsoft Access?",
    "choices": ["Untuk mengenkripsi data", "Untuk membatasi nilai yang dapat dimasukkan ke dalam kolom", "Untuk membuat laporan otomatis", "Untuk menghubungkan tabel", "Untuk membuat query"],
    "answer": "Untuk membatasi nilai yang dapat dimasukkan ke dalam kolom"
  },
  {
    "question": "Tipe data apa yang paling tepat untuk menyimpan tanggal dan waktu dalam Microsoft Access?",
    "choices": ["Text", "Number", "Date/Time", "Currency", "Yes/No"],
    "answer": "Date/Time"
  },
  {
    "question": "Apa yang terjadi jika Anda mencoba memasukkan data duplikat ke dalam kolom yang diatur sebagai kunci primer?",
    "choices": ["Data akan disimpan tanpa peringatan", "Access akan menolak data dan menampilkan pesan kesalahan", "Data akan otomatis diubah menjadi unik", "Tabel akan terhapus", "Basis data akan rusak"],
    "answer": "Access akan menolak data dan menampilkan pesan kesalahan"
  },
  {
    "question": "Bagaimana cara menambahkan kolom baru ke tabel yang sudah ada di Microsoft Access?",
    "choices": ["Hanya bisa dilakukan saat membuat tabel baru", "Melalui Design View tabel", "Hanya melalui query", "Menggunakan makro", "Tidak bisa menambahkan kolom setelah tabel dibuat"],
    "answer": "Melalui Design View tabel"
  },
  {
    "question": "Apa keuntungan menggunakan Lookup Wizard untuk membuat daftar drop-down?",
    "choices": ["Meningkatkan keamanan data", "Mempercepat entri data dan mengurangi kesalahan", "Mengenkripsi data dalam kolom", "Membuat laporan otomatis", "Meningkatkan kecepatan query"],
    "answer": "Mempercepat entri data dan mengurangi kesalahan"
  },
  {
    "question": "Apa yang dimaksud dengan \"field size\" dalam pengaturan kolom tipe Text?",
    "choices": ["Ukuran font yang digunakan", "Jumlah karakter maksimum yang dapat disimpan", "Lebar kolom saat ditampilkan", "Jumlah baris dalam tabel", "Ukuran file database"],
    "answer": "Jumlah karakter maksimum yang dapat disimpan"
  },
  {
    "question": "Bagaimana cara mengubah urutan kolom dalam sebuah tabel di Microsoft Access?",
    "choices": ["Hanya bisa dilakukan saat membuat tabel", "Menggunakan query", "Melalui Design View dengan drag and drop", "Menggunakan makro", "Tidak bisa mengubah urutan kolom"],
    "answer": "Melalui Design View dengan drag and drop"
  },
  {
    "question": "Apa fungsi dari pengaturan \"Required\" pada properti kolom?",
    "choices": ["Membuat kolom menjadi kunci primer", "Mengharuskan pengguna memasukkan nilai", "Membuat kolom hanya bisa dibaca", "Mengenkripsi data dalam kolom", "Membuat kolom tidak terlihat"],
    "answer": "Mengharuskan pengguna memasukkan nilai"
  },
  {
    "question": "Tipe data apa yang paling tepat untuk menyimpan nilai boolean (Ya/Tidak) dalam Microsoft Access?",
    "choices": ["Text", "Number", "Currency", "Yes/No", "Memo"],
    "answer": "Yes/No"
  },
  {
    "question": "Apa yang terjadi jika Anda mengubah tipe data sebuah kolom yang sudah berisi data?",
    "choices": ["Data akan selalu hilang", "Access akan mencoba mengkonversi data jika memungkinkan", "Tabel akan terhapus", "Basis data akan rusak", "Tidak bisa mengubah tipe data setelah ada data"],
    "answer": "Access akan mencoba mengkonversi data jika memungkinkan"
  },
  {
    "question": "Bagaimana cara membuat kolom yang secara otomatis menambah nilainya untuk setiap baris baru?",
    "choices": ["Menggunakan tipe data AutoNumber", "Membuat query", "Menggunakan makro", "Menggunakan VBA", "Tidak mungkin dilakukan di Access"],
    "answer": "Menggunakan tipe data AutoNumber"
  },
  {
    "question": "Apa fungsi dari pengaturan \"Default Value\" pada properti kolom?",
    "choices": ["Membuat kolom menjadi kunci primer", "Menetapkan nilai awal saat menambahkan record baru", "Membatasi nilai yang bisa dimasukkan", "Mengenkripsi data dalam kolom", "Membuat kolom hanya bisa dibaca"],
    "answer": "Menetapkan nilai awal saat menambahkan record baru"
  },
  {
    "question": "Bagaimana cara terbaik untuk membatasi nilai dalam sebuah kolom agar hanya bisa diisi dengan angka positif?",
    "choices": ["Menggunakan tipe data Text", "Menggunakan aturan validasi", "Menggunakan Lookup Wizard", "Menggunakan query", "Menggunakan makro"],
    "answer": "Menggunakan aturan validasi"
  },
  {
    "question": "Apa yang dimaksud dengan \"Cascade Update Related Fields\" dalam pengaturan relasi antar tabel?",
    "choices": ["Menghapus semua data terkait", "Memperbarui data terkait saat kunci primer diubah", "Membuat backup otomatis", "Mengenkripsi data terkait", "Membuat query otomatis"],
    "answer": "Memperbarui data terkait saat kunci primer diubah"
  },
  {
    "question": "Apa fungsi dari tipe data \"Attachment\" dalam Microsoft Access?",
    "choices": ["Untuk menyimpan file dalam database", "Untuk membuat hyperlink", "Untuk menyimpan gambar saja", "Untuk membuat relasi antar tabel", "Untuk membuat form otomatis"],
    "answer": "Untuk menyimpan file dalam database"
  }
    ];
})();
