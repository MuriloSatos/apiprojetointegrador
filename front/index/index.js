const slides = document.querySelectorAll(".slide");
let index = 0;

function trocarSlide() {
    slides[index].classList.remove("ativo");

    index++;
    if (index >= slides.length) {
        index = 0;
    }

    slides[index].classList.add("ativo");
}

setInterval(trocarSlide, 4000); // troca a cada 4 segundos
