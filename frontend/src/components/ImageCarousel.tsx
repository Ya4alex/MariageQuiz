import Marquee from "react-fast-marquee";

interface ImageCarouselProps {
  images: string[];
  height?: string;
  speed?: number; // px/sec
}

const ImageCarousel = ({ images, height = "40vh", speed = 60 }: ImageCarouselProps) => (
  <div style={{ width: "100%", height, overflow: "hidden" }}>
    <Marquee
      gradient={true}
      gradientWidth={"0.5rem"}
      speed={speed}
      pauseOnHover={false}
      style={{ height, overflow: "hidden" }}
      delay={3}
    >
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt=""
          style={{
            maxHeight: height,
            borderRadius: "1rem",
            marginLeft: "0.5rem",
            objectFit: "contain",
            boxShadow: "1px 2px 8px rgba(0,0,0,0.07)",
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={true}
        />
      ))}
    </Marquee>
  </div>
);

export default ImageCarousel;
