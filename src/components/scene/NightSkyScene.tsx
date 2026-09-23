/**
 * Bầu trời sao ban đêm.
 *
 * Dải ngân hà là một mảng gradient xoay chéo rồi làm mờ; sao nền là
 * radial-gradient lặp lại nên hàng trăm ngôi sao không tốn phần tử nào; mưa
 * sao băng là năm vệt lệch chu kỳ nhau. Dãy núi soi bóng xuống hồ ở dưới cùng,
 * và thiên thạch rơi khuất sau rặng núi chứ không biến mất giữa trời.
 *
 * Luật hiện/ẩn theo tiến độ nằm trong `src/styles/scene.css`.
 */
export function NightSkyScene() {
  return (
    <>
      <div className="scene-sky" />
      <div className="scene-milky" />
      <div className="scene-stars scene-stars--1" />
      <div className="scene-stars scene-stars--2" />
      <div className="scene-stars scene-stars--3" />

      <Meteor index={1} />
      {/* Quả lớn ánh cam: phần thưởng cho streak. */}
      <Meteor index={2} />
      <Meteor index={3} />
      <Meteor index={4} />
      <Meteor index={5} />

      <svg className="scene-mountains" viewBox="0 0 390 132" preserveAspectRatio="none">
        <Ridges />
      </svg>

      <div className="scene-lake">
        <svg className="scene-lake-mirror" viewBox="0 0 390 132" preserveAspectRatio="none">
          <Ridges reflection />
        </svg>
        <div className="scene-lake-fade" />
        <div className="scene-ripple scene-ripple--1" />
        <div className="scene-ripple scene-ripple--2" />
        <div className="scene-ripple scene-ripple--3" />
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
        <path d="M0 132 46 62l30 32 40-58 34 44 36-30 44 56 38-40 40 34 42-26 40 54v-16H0Z" fill="#141f4c" />
      )}
      <path
        d="M0 132 38 78l26 26 44-48 30 40 40-26 34 48 44-36 36 30 46-20 52 40V132Z"
        fill={reflection ? '#2a3a78' : '#070b1e'}
      />
      <path
        d="M108 96l30-40 30 40"
        fill="none"
        stroke={reflection ? 'rgba(255,176,130,.6)' : 'rgba(255,176,130,.5)'}
        strokeWidth={reflection ? 3 : 2.4}
        strokeLinejoin="round"
      />
      {!reflection && (
        <path
          d="M218 92l44-36 20 17"
          fill="none"
          stroke="rgba(255,176,130,.32)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </>
  )
}

/** Một thiên thạch: vệt đuôi mờ dần cộng chấm sáng ở mũi, do CSS vẽ và cho rơi. */
function Meteor({ index }: { index: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className={`scene-meteor scene-meteor--${index}`}>
      <div className="scene-meteor-streak" />
    </div>
  )
}
