/**
 * Bầu trời sao ban đêm.
 *
 * Dựng theo ảnh chụp thật của dải ngân hà trên rặng núi soi bóng xuống hồ:
 *
 * - Dải ngân hà là bốn lớp chồng nhau — quầng rộng, lõi sáng, sao li ti trong
 *   lòng dải, và vệt bụi tối cắt dọc thân dải. Một gradient đơn chỉ ra một vệt
 *   khói tím; phải đủ bốn lớp mới ra chiều sâu của ảnh chụp.
 * - Sao nền là radial-gradient lặp lại trên bốn lớp, nên hàng trăm ngôi sao
 *   không tốn phần tử nào. Sáu ngôi sáng nhất có tia nhiễu xạ hình chữ thập.
 * - Ánh đèn thành phố hắt lên sau rặng núi, và cả bầu trời soi bóng xuống hồ.
 * - Mưa sao băng rơi khuất sau rặng núi chứ không biến mất giữa trời.
 *
 * Luật hiện/ẩn theo tiến độ nằm trong `src/styles/scene.css`.
 */
export function NightSkyScene() {
  return (
    <>
      <div className="scene-sky" />

      <div className="scene-milky">
        <div className="scene-milky-haze" />
        <div className="scene-milky-core" />
        <div className="scene-milky-grain" />
        <div className="scene-milky-dust" />
      </div>

      <div className="scene-stars scene-stars--1" />
      <div className="scene-stars scene-stars--2" />
      <div className="scene-stars scene-stars--3" />
      <div className="scene-stars scene-stars--4" />

      <div className="scene-bigstar scene-bigstar--1" />
      <div className="scene-bigstar scene-bigstar--2" />
      <div className="scene-bigstar scene-bigstar--3" />
      <div className="scene-bigstar scene-bigstar--4" />
      <div className="scene-bigstar scene-bigstar--5" />
      <div className="scene-bigstar scene-bigstar--6" />

      <div className="scene-horizon" />

      <Meteor index={1} />
      {/* Quả lớn ánh cam: phần thưởng cho streak. */}
      <Meteor index={2} />
      <Meteor index={3} />
      <Meteor index={4} />
      <Meteor index={5} />
      <Meteor index={6} />
      <Meteor index={7} />

      <svg className="scene-mountains" viewBox="0 0 390 132" preserveAspectRatio="none">
        <Ridges />
      </svg>

      <div className="scene-lake">
        <svg className="scene-lake-mirror" viewBox="0 0 390 132" preserveAspectRatio="none">
          <Ridges reflection />
        </svg>
        <div className="scene-lake-glow" />
        <div className="scene-lake-fade" />
        <div className="scene-ripple scene-ripple--1" />
        <div className="scene-ripple scene-ripple--2" />
        <div className="scene-ripple scene-ripple--3" />
        <div className="scene-ripple scene-ripple--4" />
      </div>
    </>
  )
}

/**
 * Dãy núi. Bản dưới hồ chỉ khác ở chỗ sáng hơn một chút — nước hắt lại ánh
 * trời chứ không phải soi gương, nên đỉnh núi tối vẫn nhìn ra được trong bóng.
 */
function Ridges({ reflection = false }: { reflection?: boolean }) {
  return (
    <>
      {!reflection && (
        <>
          <path
            d="M0 132 38 54l26 26 34-44 30 38 40-30 30 44 40-48 34 40 46-30 42 46-10 30H0Z"
            fill="#1a2554"
          />
          <path
            d="M0 132 46 62l30 32 40-58 34 44 36-30 44 56 38-40 40 34 42-26 40 54v-16H0Z"
            fill="#141f4c"
          />
        </>
      )}
      <path
        d="M0 132 38 78l26 26 44-48 30 40 40-26 34 48 44-36 36 30 46-20 52 40V132Z"
        fill={reflection ? '#2a3a78' : '#070b1e'}
      />
      {/* Tuyết trên đỉnh, bắt ánh đèn dưới thung lũng — chi tiết làm rặng núi
          có khối chứ không phải một mảng đen phẳng. */}
      <path
        d="M108 96l30-40 30 40"
        fill="none"
        stroke={reflection ? 'rgba(255,176,130,.6)' : 'rgba(255,186,138,.62)'}
        strokeWidth={reflection ? 3 : 2.6}
        strokeLinejoin="round"
      />
      {!reflection && (
        <>
          <path
            d="M218 92l44-36 20 17"
            fill="none"
            stroke="rgba(255,176,130,.38)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M18 104 38 78l14 14"
            fill="none"
            stroke="rgba(214,226,255,.24)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M300 108l30-24 24 20"
            fill="none"
            stroke="rgba(214,226,255,.2)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      )}
    </>
  )
}

/** Một thiên thạch: vệt đuôi mờ dần cộng chấm sáng ở mũi, do CSS vẽ và cho rơi. */
function Meteor({ index }: { index: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  return (
    <div className={`scene-meteor scene-meteor--${index}`}>
      <div className="scene-meteor-streak" />
    </div>
  )
}
