package com.shadcn.backend.service;

import com.shadcn.backend.model.MessageTemplate;
import com.shadcn.backend.model.MessageTemplate.TemplateType;
import com.shadcn.backend.repository.MessageTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageTemplateService {
    
    private final MessageTemplateRepository templateRepository;
    
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initDefaultTemplates() {
        try {
            // Only seed if no templates exist
            if (templateRepository.count() == 0) {
                log.info("Seeding default message templates...");
                seedDefaultTemplates();
            } else {
                // Check and seed missing template types
                if (templateRepository.findByType(TemplateType.PDF).isEmpty()) {
                    log.info("Seeding PDF message templates...");
                    seedPdfTemplates();
                }
                if (templateRepository.findByType(TemplateType.WHATSAPP_PDF).isEmpty()) {
                    log.info("Seeding WHATSAPP_PDF message templates...");
                    seedWhatsappPdfTemplates();
                }
            }
        } catch (Exception e) {
            log.error("Error seeding default templates: {}", e.getMessage());
        }
    }
    
    private void seedPdfTemplates() {
        // English (Default)
        createTemplate(TemplateType.PDF, "en", "English",
            """
            Subject: Warm Welcome and Congratulations on Joining Our Family
            
            Dear :name,
            
            With great joy and enthusiasm, we, the entire management and staff of Global Innovation Company, extend the warmest welcome upon your joining us.
            
            Your decision to join is great news for us. We believe that the spirit and talent you possess are the keys that will strengthen innovation and team collaboration. We are ready to support your professional journey.
            
            We are dedicated to creating a dynamic, challenging, and supportive environment. We can't wait to see how your new energy will drive the achievement of our important projects in the future.
            
            Once again, welcome, :name. We greatly look forward to productive and enjoyable working days with you.
            """, true);
        
        // Indonesian
        createTemplate(TemplateType.PDF, "id", "Bahasa Indonesia",
            """
            Perihal: Sambutan Hangat dan Selamat Bergabung dengan Keluarga Kami
            
            Yth. Sdr/i :name,
            
            Dengan penuh sukacita dan antusiasme, kami, seluruh jajaran manajemen dan staf Perusahaan Inovasi Global, mengucapkan selamat datang yang paling hangat atas bergabungnya Anda bersama kami.
            
            Keputusan Anda untuk bergabung adalah kabar baik bagi kami. Kami percaya, semangat dan talenta yang Anda miliki adalah kunci yang akan memperkuat inovasi dan kolaborasi tim kami. Kami siap mendukung perjalanan profesional Anda.
            
            Kami berdedikasi untuk menciptakan lingkungan yang dinamis, menantang, dan suportif. Kami tidak sabar melihat bagaimana energi baru dari Anda akan mendorong pencapaian proyek-proyek penting kami di masa depan.
            
            Sekali lagi, selamat datang, :name. Kami sangat menantikan hari-hari kerja yang produktif dan menyenangkan bersama Anda.
            """, false);
        
        // Chinese
        createTemplate(TemplateType.PDF, "zh", "中文 (Chinese)",
            """
            主题：热烈欢迎并祝贺您加入我们的大家庭
            
            亲爱的 :name，
            
            我们全球创新公司的全体管理层和员工，怀着极大的喜悦和热情，对您的加入表示最热烈的欢迎。
            
            您选择加入对我们来说是个好消息。我们相信，您所拥有的精神和才能是加强创新和团队协作的关键。我们随时准备支持您的职业发展。
            
            我们致力于创造一个充满活力、具有挑战性和支持性的环境。我们迫不及待地想看到您的新能量将如何推动我们未来重要项目的实现。
            
            再次欢迎您，:name。我们非常期待与您一起度过高效而愉快的工作时光。
            """, false);
        
        // Japanese
        createTemplate(TemplateType.PDF, "ja", "日本語 (Japanese)",
            """
            件名：温かい歓迎と、私たちの家族へのご入社おめでとうございます
            
            :name 様
            
            グローバルイノベーション株式会社の経営陣およびスタッフ一同、心より歓迎申し上げます。
            
            ご入社いただけることは、私たちにとって大変嬉しいニュースです。あなたが持つ精神と才能は、イノベーションとチームの協力を強化する鍵になると確信しています。あなたのキャリアを全力でサポートする所存です。
            
            私たちは、ダイナミックでチャレンジングかつサポーティブな環境の創造に専念しています。あなたの新しいエネルギーが、将来の重要なプロジェクトの達成をどのように推進するか、とても楽しみにしています。
            
            改めて、ようこそ、:name さん。生産的で楽しい仕事の日々を心よりお待ちしております。
            """, false);
        
        // Korean
        createTemplate(TemplateType.PDF, "ko", "한국어 (Korean)",
            """
            제목: 따뜻한 환영과 우리 가족이 되신 것을 축하드립니다
            
            :name 님께,
            
            글로벌 이노베이션 회사의 경영진과 직원 일동은 큰 기쁨과 열정으로 귀하의 합류를 진심으로 환영합니다.
            
            함께하기로 결정해 주셔서 정말 감사합니다. 귀하가 가진 열정과 재능이 혁신과 팀 협력을 강화하는 열쇠가 될 것이라 믿습니다. 귀하의 전문적인 여정을 지원할 준비가 되어 있습니다.
            
            우리는 역동적이고 도전적이며 지원적인 환경을 만들기 위해 헌신하고 있습니다. 귀하의 새로운 에너지가 앞으로의 중요한 프로젝트 달성을 어떻게 이끌어갈지 매우 기대됩니다.
            
            다시 한번 환영합니다, :name 님. 생산적이고 즐거운 근무일들을 함께하기를 진심으로 기대합니다.
            """, false);
        
        log.info("PDF message templates seeded successfully!");
    }
    
    private void seedWhatsappPdfTemplates() {
        // English (Default)
        createTemplate(TemplateType.WHATSAPP_PDF, "en", "English",
            """
            Hello :name!
            
            We have a special letter for you.
            
            Click the following link to view:
            :linkpdf
            
            Thank you!
            """, true);
        
        // Indonesian
        createTemplate(TemplateType.WHATSAPP_PDF, "id", "Bahasa Indonesia",
            """
            Halo :name!
            
            Kami punya surat spesial untuk Anda.
            
            Klik link berikut untuk melihat:
            :linkpdf
            
            Terima kasih!
            """, false);
        
        // Chinese
        createTemplate(TemplateType.WHATSAPP_PDF, "zh", "中文 (Chinese)",
            """
            你好 :name！
            
            我们为您准备了一封特别的信。
            
            点击以下链接查看：
            :linkpdf
            
            谢谢！
            """, false);
        
        // Japanese
        createTemplate(TemplateType.WHATSAPP_PDF, "ja", "日本語 (Japanese)",
            """
            こんにちは :name さん！
            
            特別なお手紙をご用意しました。
            
            以下のリンクをクリックしてご覧ください：
            :linkpdf
            
            ありがとうございます！
            """, false);
        
        // Korean
        createTemplate(TemplateType.WHATSAPP_PDF, "ko", "한국어 (Korean)",
            """
            안녕하세요 :name님!
            
            특별한 편지를 준비했습니다.
            
            다음 링크를 클릭하여 확인하세요:
            :linkpdf
            
            감사합니다!
            """, false);
        
        log.info("WHATSAPP_PDF message templates seeded successfully!");
    }
    
    private void seedDefaultTemplates() {
        // === VIDEO TEMPLATES ===
        
        // English (Default)
        createTemplate(TemplateType.VIDEO, "en", "English",
            """
            Today is a very special day for you, :name, a meaningful milestone in your life's journey. I want to express my most sincere Happy Birthday wishes. May all the goodness and happiness that you, :name, have spread to those around you return to you manifold on this joyful day. Welcome this new age with a heart full of gratitude and burning spirit, :name.
            
            Looking back at the years that have passed, we can see how many achievements and valuable lessons you have gone through, :name. Every challenge you have overcome has shaped you into a strong, wise, and inspiring person. Celebrate yourself and all the extraordinary things that :name has done so far. Your presence, :name, brings positive impact and warmth to many people, and that is the greatest priceless gift.
            
            Entering this new chapter of life, :name, may your path be illuminated by hope, joy, and brilliant new opportunities. Let this new age be the year where your delayed dreams begin to come true, where you find new exciting adventures, and where :name gets closer to the best version of yourself.
            
            Always remember, :name, that you are never alone in this journey. There are many people—family, friends, and colleagues—who truly care and are ready to support your every step. Don't hesitate to share difficulties or celebrate small victories. We are all proud of the hard work and sincerity that :name always shows in living life. :name is a role model worth emulating.
            
            May this year bring new energy to explore new hobbies, learn new skills, or simply take more time to rest and enjoy the simple things. Prioritize your happiness and inner peace, :name. Because when your soul is calm, everything you do will radiate more beautiful results. :name deserves all the goodness in the world.
            
            Once again, Happy Birthday, :name! Enjoy every second of your special day. May you have long life, always be happy, and always be an inspiration to all of us. May God always bestow His grace and blessings upon your life. We all love you and always support you, :name!
            """, true);
        
        // Indonesian
        createTemplate(TemplateType.VIDEO, "id", "Bahasa Indonesia",
            """
            Hari ini adalah hari yang sangat spesial untukmu, :name, sebuah penanda perjalanan hidup yang penuh makna. Saya ingin mengucapkan Selamat Ulang Tahun yang paling tulus. Semoga di hari bahagiamu ini, segala kebaikan dan kebahagiaan yang pernah :name sebarkan kepada orang-orang di sekitarmu kembali berlipat ganda kepadamu. Sambut usia baru ini dengan hati yang penuh syukur dan semangat yang membara, :name.
            
            Melihat kembali tahun-tahun yang telah berlalu, kita bisa melihat betapa banyak pencapaian dan pelajaran berharga yang telah kamu lalui, :name. Setiap tantangan yang berhasil kamu atasi telah membentukmu menjadi pribadi yang kuat, bijaksana, dan menginspirasi. Rayakanlah dirimu dan segala hal luar biasa yang telah :name lakukan hingga saat ini. Kehadiranmu, :name, membawa dampak positif dan kehangatan bagi banyak orang, dan itu adalah hadiah terbesar yang tak ternilai harganya.
            
            Memasuki babak baru dalam hidup ini, :name, semoga jalanmu diterangi oleh harapan, kegembiraan, dan kesempatan-kesempatan baru yang cemerlang. Biarkan usia baru ini menjadi tahun di mana impian-impianmu yang tertunda mulai terwujud, di mana kamu menemukan petualangan-petualangan baru yang menyenangkan, dan di mana :name semakin mendekati versi terbaik dari dirimu.
            
            Ingatlah selalu, :name, bahwa kamu tidak pernah sendiri dalam perjalanan ini. Ada banyak orang—keluarga, sahabat, dan rekan kerja—yang sangat peduli dan siap mendukung setiap langkahmu. Jangan ragu untuk berbagi kesulitan atau merayakan kemenangan kecil. Kami semua bangga dengan kerja keras dan ketulusan hati yang selalu :name tunjukkan dalam menjalani hidup. :name adalah sosok yang patut dicontoh.
            
            Semoga tahun ini membawa energi baru untuk mengeksplorasi hobi baru, mempelajari keterampilan baru, atau bahkan hanya meluangkan waktu lebih banyak untuk beristirahat dan menikmati hal-hal sederhana. Prioritaskan kebahagiaan dan kedamaian batinmu, :name. Karena ketika jiwamu tenang, segala yang kamu kerjakan akan memancarkan hasil yang lebih indah. :name pantas mendapatkan semua kebaikan di dunia.
            
            Sekali lagi, Selamat Ulang Tahun, :name! Nikmati setiap detik dari hari istimewamu ini. Semoga panjang umur, selalu bahagia, dan selalu menjadi inspirasi bagi kami semua. Semoga Tuhan senantiasa melimpahkan rahmat dan berkah-Nya atas hidupmu. Kami semua menyayangimu dan selalu mendukungmu, :name!
            """, false);
        
        // Chinese (Simplified)
        createTemplate(TemplateType.VIDEO, "zh", "中文 (Chinese)",
            """
            今天对你来说是一个非常特别的日子，:name，这是你人生旅程中一个意义非凡的里程碑。我想向你致以最真挚的生日祝福。愿你在这个快乐的日子里，:name 曾经传递给周围人的所有善良和幸福都能成倍地回报给你。:name，请以一颗充满感恩和热情的心迎接这个新的年龄。
            
            回顾过去的岁月，我们可以看到你经历了多少成就和宝贵的教训，:name。你克服的每一个挑战都塑造了你成为一个坚强、智慧和鼓舞人心的人。庆祝你自己以及 :name 迄今为止所做的一切非凡的事情。:name，你的存在给许多人带来了积极的影响和温暖，这是无价的最大礼物。
            
            进入人生的新篇章，:name，愿你的道路被希望、喜悦和灿烂的新机遇所照亮。让这个新的年龄成为你被搁置的梦想开始实现的一年，你发现令人兴奋的新冒险的一年，:name 越来越接近最好的自己的一年。
            
            永远记住，:name，你在这段旅程中从不孤单。有很多人——家人、朋友和同事——真正关心你，随时准备支持你的每一步。不要犹豫分享困难或庆祝小胜利。我们都为 :name 在生活中始终表现出的努力和真诚感到骄傲。:name 是值得效仿的榜样。
            
            愿今年带来新的能量去探索新的爱好，学习新的技能，或者只是花更多的时间休息和享受简单的事物。:name，请优先考虑你的幸福和内心的平静。因为当你的灵魂平静时，你所做的一切都会散发出更美丽的结果。:name 配得上世界上所有的美好。
            
            再次祝你生日快乐，:name！享受你特别日子的每一秒。愿你长寿、永远幸福，永远是我们所有人的灵感。愿上帝永远将祂的恩典和祝福赐予你的生命。我们都爱你，永远支持你，:name！
            """, false);
        
        // Japanese
        createTemplate(TemplateType.VIDEO, "ja", "日本語 (Japanese)",
            """
            今日は:nameにとって、人生の旅路における意義深い節目となる、とても特別な日です。心からお誕生日おめでとうございます。この喜ばしい日に、:nameが周りの人々に分け与えてきたすべての善意と幸せが、何倍にもなってあなたに返ってきますように。感謝の心と燃える情熱を持って、この新しい年齢を迎えてください、:name。
            
            過ぎ去った年月を振り返ると、:nameがどれだけ多くの成果と貴重な教訓を経験してきたかがわかります。あなたが乗り越えてきたすべての挑戦が、あなたを強く、賢く、人を鼓舞する人物へと形作ってきました。:nameがこれまでに成し遂げてきたすべての素晴らしいことを祝いましょう。:nameの存在は多くの人々にポジティブな影響と温かさをもたらしており、それは何物にも代えがたい最高の贈り物です。
            
            人生の新しい章に入る:name、あなたの道が希望、喜び、そして輝かしい新しい機会で照らされますように。この新しい年齢が、延期されていた夢が叶い始める年、ワクワクする新しい冒険を見つける年、:nameが最高の自分にさらに近づく年になりますように。
            
            いつも覚えておいてください、:name、この旅であなたは決して一人ではありません。家族、友人、同僚など、本当にあなたを大切に思い、あなたの一歩一歩を支える準備ができている多くの人がいます。困難を分かち合ったり、小さな勝利を祝ったりすることを躊躇しないでください。私たちは皆、:nameが人生で常に見せてきた努力と誠実さを誇りに思っています。:nameは見習うべきお手本です。
            
            今年が新しい趣味を探求したり、新しいスキルを学んだり、あるいは単に休息を取り、シンプルなことを楽しむ時間を増やすための新しいエネルギーをもたらしますように。:name、あなたの幸せと心の平和を優先してください。魂が穏やかであれば、あなたが行うすべてのことがより美しい結果を放ちます。:nameは世界のすべての善いものを受けるに値します。
            
            改めて、お誕生日おめでとうございます、:name！この特別な日の一秒一秒を楽しんでください。長寿と幸福、そしていつも私たち全員のインスピレーションでありますように。神様があなたの人生に恵みと祝福を常に与えてくださいますように。私たちは皆あなたを愛し、いつも応援しています、:name！
            """, false);
        
        // Korean
        createTemplate(TemplateType.VIDEO, "ko", "한국어 (Korean)",
            """
            오늘은 :name에게 매우 특별한 날입니다. 인생 여정에서 의미 있는 이정표가 되는 날이죠. 진심 어린 생일 축하 인사를 전합니다. 이 기쁜 날, :name이 주변 사람들에게 나눠준 모든 선함과 행복이 몇 배로 당신에게 돌아오기를 바랍니다. 감사한 마음과 열정으로 이 새로운 나이를 맞이하세요, :name.
            
            지나온 세월을 돌아보면, :name이 얼마나 많은 성취와 소중한 교훈을 경험했는지 알 수 있습니다. 당신이 극복한 모든 도전이 당신을 강하고, 지혜롭고, 영감을 주는 사람으로 만들었습니다. :name이 지금까지 해온 모든 대단한 일들을 축하하세요. :name의 존재는 많은 사람들에게 긍정적인 영향과 따뜻함을 가져다주며, 그것은 값을 매길 수 없는 가장 큰 선물입니다.
            
            인생의 새로운 장에 들어서는 :name, 당신의 길이 희망, 기쁨, 그리고 빛나는 새로운 기회로 밝혀지기를 바랍니다. 이 새로운 나이가 미뤄왔던 꿈이 실현되기 시작하고, 신나는 새로운 모험을 발견하며, :name이 최고의 자신에게 더 가까워지는 해가 되기를 바랍니다.
            
            항상 기억하세요, :name, 이 여정에서 당신은 결코 혼자가 아닙니다. 가족, 친구, 동료들—진심으로 당신을 아끼고 당신의 모든 발걸음을 지지할 준비가 된 많은 사람들이 있습니다. 어려움을 나누거나 작은 승리를 축하하는 것을 주저하지 마세요. 우리 모두는 :name이 삶에서 항상 보여주는 노력과 진심에 자랑스러워합니다. :name은 본받을 만한 롤모델입니다.
            
            올해가 새로운 취미를 탐험하고, 새로운 기술을 배우거나, 단순히 휴식을 취하고 소소한 것들을 즐기는 시간을 더 많이 갖는 새로운 에너지를 가져다주기를 바랍니다. :name, 당신의 행복과 마음의 평화를 우선시하세요. 영혼이 평온할 때, 당신이 하는 모든 일이 더 아름다운 결과를 발산할 것입니다. :name은 세상의 모든 좋은 것을 받을 자격이 있습니다.
            
            다시 한번, 생일 축하합니다, :name! 이 특별한 날의 매 순간을 즐기세요. 장수하고, 항상 행복하며, 우리 모두에게 항상 영감이 되기를 바랍니다. 하나님께서 항상 당신의 삶에 은혜와 축복을 베푸시기를 바랍니다. 우리 모두 당신을 사랑하고 항상 응원합니다, :name!
            """, false);
        
        // Thai
        createTemplate(TemplateType.VIDEO, "th", "ไทย (Thai)",
            """
            วันนี้เป็นวันที่พิเศษมากสำหรับคุณ :name เป็นหมุดหมายที่มีความหมายในการเดินทางชีวิตของคุณ ผมขอแสดงความยินดีวันเกิดอย่างจริงใจที่สุด ขอให้ในวันแห่งความสุขนี้ ความดีและความสุขทั้งหมดที่ :name ได้มอบให้คนรอบข้างกลับคืนมาหาคุณเป็นทวีคูณ ต้อนรับวัยใหม่นี้ด้วยหัวใจที่เต็มไปด้วยความกตัญญูและจิตวิญญาณที่ลุกโชน :name
            
            มองย้อนกลับไปในปีที่ผ่านมา เราเห็นได้ว่า :name ได้ผ่านความสำเร็จและบทเรียนอันล้ำค่ามากมายเพียงใด ทุกความท้าทายที่คุณเอาชนะได้หล่อหลอมให้คุณเป็นคนที่แข็งแกร่ง ฉลาด และสร้างแรงบันดาลใจ เฉลิมฉลองตัวเองและสิ่งพิเศษทั้งหมดที่ :name ทำมาจนถึงตอนนี้ การมีอยู่ของ :name นำผลกระทบเชิงบวกและความอบอุ่นมาสู่ผู้คนมากมาย และนั่นคือของขวัญที่ยิ่งใหญ่ที่สุดที่ประเมินค่าไม่ได้
            
            เข้าสู่บทใหม่ของชีวิต :name ขอให้เส้นทางของคุณสว่างไสวด้วยความหวัง ความสุข และโอกาสใหม่ที่รุ่งโรจน์ ขอให้วัยใหม่นี้เป็นปีที่ความฝันที่ถูกเลื่อนออกไปเริ่มเป็นจริง ที่คุณพบการผจญภัยใหม่ที่น่าตื่นเต้น และที่ :name เข้าใกล้เวอร์ชันที่ดีที่สุดของตัวเองมากขึ้น
            
            จำไว้เสมอ :name ว่าคุณไม่เคยอยู่คนเดียวในการเดินทางนี้ มีคนมากมาย—ครอบครัว เพื่อน และเพื่อนร่วมงาน—ที่ใส่ใจอย่างแท้จริงและพร้อมสนับสนุนทุกก้าวของคุณ อย่าลังเลที่จะแบ่งปันความยากลำบากหรือเฉลิมฉลองชัยชนะเล็กๆ พวกเราทุกคนภูมิใจในการทำงานหนักและความจริงใจที่ :name แสดงออกในการใช้ชีวิตเสมอ :name เป็นแบบอย่างที่ควรเลียนแบบ
            
            ขอให้ปีนี้นำพลังใหม่มาสำรวจงานอดิเรกใหม่ เรียนรู้ทักษะใหม่ หรือเพียงแค่มีเวลาพักผ่อนและเพลิดเพลินกับสิ่งเรียบง่ายมากขึ้น :name ให้ความสำคัญกับความสุขและความสงบภายในของคุณ เพราะเมื่อจิตวิญญาณของคุณสงบ ทุกสิ่งที่คุณทำจะเปล่งประกายผลลัพธ์ที่สวยงามยิ่งขึ้น :name สมควรได้รับสิ่งดีๆ ทั้งหมดในโลก
            
            อีกครั้ง สุขสันต์วันเกิด :name! เพลิดเพลินกับทุกวินาทีของวันพิเศษของคุณ ขอให้อายุยืน มีความสุขเสมอ และเป็นแรงบันดาลใจให้พวกเราทุกคนเสมอ ขอพระเจ้าประทานพระคุณและพรของพระองค์แก่ชีวิตของคุณตลอดไป พวกเราทุกคนรักคุณและสนับสนุนคุณเสมอ :name!
            """, false);
        
        // Vietnamese
        createTemplate(TemplateType.VIDEO, "vi", "Tiếng Việt (Vietnamese)",
            """
            Hôm nay là một ngày rất đặc biệt với bạn, :name, một cột mốc ý nghĩa trong hành trình cuộc đời. Tôi muốn gửi đến bạn lời chúc Sinh nhật chân thành nhất. Mong rằng trong ngày vui này, tất cả những điều tốt đẹp và hạnh phúc mà :name đã lan tỏa đến những người xung quanh sẽ trở lại với bạn gấp bội. Hãy đón nhận tuổi mới này với trái tim tràn đầy biết ơn và tinh thần bừng cháy, :name.
            
            Nhìn lại những năm tháng đã qua, chúng ta có thể thấy :name đã trải qua biết bao thành tựu và bài học quý giá. Mỗi thử thách mà bạn vượt qua đã hun đúc bạn thành một người mạnh mẽ, sáng suốt và truyền cảm hứng. Hãy tự hào về bản thân và những điều phi thường mà :name đã làm được cho đến nay. Sự hiện diện của :name mang đến tác động tích cực và sự ấm áp cho nhiều người, và đó là món quà vô giá lớn nhất.
            
            Bước vào chương mới của cuộc đời, :name, mong con đường của bạn được soi sáng bởi hy vọng, niềm vui và những cơ hội mới rực rỡ. Hãy để tuổi mới này trở thành năm mà những ước mơ bị trì hoãn bắt đầu thành hiện thực, nơi bạn tìm thấy những cuộc phiêu lưu mới thú vị, và nơi :name ngày càng tiến gần hơn đến phiên bản tốt nhất của chính mình.
            
            Hãy luôn nhớ, :name, rằng bạn không bao giờ đơn độc trong hành trình này. Có rất nhiều người—gia đình, bạn bè và đồng nghiệp—thực sự quan tâm và sẵn sàng hỗ trợ từng bước đi của bạn. Đừng ngần ngại chia sẻ khó khăn hay ăn mừng những chiến thắng nhỏ. Tất cả chúng tôi đều tự hào về sự chăm chỉ và chân thành mà :name luôn thể hiện trong cuộc sống. :name là tấm gương đáng noi theo.
            
            Mong năm nay mang đến năng lượng mới để khám phá sở thích mới, học kỹ năng mới, hoặc đơn giản là dành nhiều thời gian hơn để nghỉ ngơi và tận hưởng những điều giản đơn. :name, hãy ưu tiên hạnh phúc và sự bình yên nội tâm của bạn. Bởi khi tâm hồn bạn yên bình, mọi thứ bạn làm sẽ tỏa sáng kết quả đẹp đẽ hơn. :name xứng đáng được nhận mọi điều tốt đẹp trên thế giới.
            
            Một lần nữa, Chúc mừng Sinh nhật, :name! Hãy tận hưởng từng giây phút trong ngày đặc biệt của bạn. Chúc bạn sống lâu, luôn hạnh phúc, và mãi là nguồn cảm hứng cho tất cả chúng tôi. Cầu Chúa luôn ban phước lành cho cuộc đời bạn. Tất cả chúng tôi yêu thương và luôn ủng hộ bạn, :name!
            """, false);
        
        // Malay
        createTemplate(TemplateType.VIDEO, "ms", "Bahasa Melayu (Malay)",
            """
            Hari ini adalah hari yang sangat istimewa untuk anda, :name, satu penanda bermakna dalam perjalanan hidup anda. Saya ingin mengucapkan Selamat Hari Lahir yang paling ikhlas. Semoga pada hari yang menggembirakan ini, segala kebaikan dan kebahagiaan yang :name telah sebarkan kepada orang-orang di sekeliling anda kembali kepada anda berlipat ganda. Sambut usia baru ini dengan hati yang penuh syukur dan semangat yang berkobar, :name.
            
            Melihat kembali tahun-tahun yang telah berlalu, kita dapat melihat betapa banyak pencapaian dan pelajaran berharga yang telah :name lalui. Setiap cabaran yang berjaya anda atasi telah membentuk anda menjadi seorang yang kuat, bijaksana, dan memberi inspirasi. Rayakan diri anda dan semua perkara luar biasa yang :name telah lakukan setakat ini. Kehadiran :name membawa impak positif dan kehangatan kepada ramai orang, dan itu adalah hadiah terbesar yang tidak ternilai harganya.
            
            Memasuki bab baru dalam kehidupan ini, :name, semoga jalan anda diterangi oleh harapan, kegembiraan, dan peluang-peluang baru yang cemerlang. Biarkan usia baru ini menjadi tahun di mana impian-impian yang tertangguh mula menjadi kenyataan, di mana anda menemui pengembaraan baru yang menarik, dan di mana :name semakin menghampiri versi terbaik diri sendiri.
            
            Ingatlah selalu, :name, bahawa anda tidak pernah bersendirian dalam perjalanan ini. Terdapat ramai orang—keluarga, sahabat, dan rakan sekerja—yang benar-benar mengambil berat dan bersedia menyokong setiap langkah anda. Jangan teragak-agak untuk berkongsi kesusahan atau meraikan kemenangan kecil. Kami semua bangga dengan kerja keras dan keikhlasan yang sentiasa :name tunjukkan dalam menjalani kehidupan. :name adalah contoh yang patut diikuti.
            
            Semoga tahun ini membawa tenaga baru untuk meneroka hobi baru, mempelajari kemahiran baru, atau sekadar meluangkan lebih banyak masa untuk berehat dan menikmati perkara-perkara yang mudah. :name, utamakan kebahagiaan dan ketenangan dalaman anda. Kerana apabila jiwa anda tenang, segala yang anda lakukan akan memancarkan hasil yang lebih indah. :name layak mendapat semua kebaikan di dunia.
            
            Sekali lagi, Selamat Hari Lahir, :name! Nikmati setiap saat hari istimewa anda. Semoga panjang umur, sentiasa bahagia, dan sentiasa menjadi inspirasi kepada kami semua. Semoga Tuhan sentiasa melimpahkan rahmat dan berkat-Nya ke atas hidup anda. Kami semua menyayangi dan sentiasa menyokong anda, :name!
            """, false);
        
        // Filipino/Tagalog
        createTemplate(TemplateType.VIDEO, "tl", "Filipino (Tagalog)",
            """
            Ngayong araw ay isang napaka-espesyal na araw para sa iyo, :name, isang makabuluhang milestone sa iyong buhay. Nais kong magbigay ng pinakatapat na pagbati ng Maligayang Kaarawan. Nawa sa masayang araw na ito, ang lahat ng kabutihan at kaligayahang ibinahagi ni :name sa mga taong nakapaligid sa iyo ay bumalik sa iyo nang maraming ulit. Tanggapin ang bagong edad na ito nang may pusong puno ng pasasalamat at naglalagablab na diwa, :name.
            
            Sa paglingon sa mga taon na lumipas, makikita natin kung gaano karaming mga tagumpay at mahahalagang aral ang napagdaanan ni :name. Bawat hamon na iyong nalampasan ay humubog sa iyo upang maging isang malakas, matalino, at nakakapagbigay-inspirasyong tao. Ipagdiwang ang iyong sarili at lahat ng kamangha-manghang bagay na nagawa ni :name hanggang ngayon. Ang presensya ni :name ay nagdadala ng positibong epekto at init sa maraming tao, at iyon ang pinakadakilang regalo na walang katumbas na halaga.
            
            Sa pagpasok sa bagong kabanata ng buhay na ito, :name, nawa'y maliwanagan ang iyong landas ng pag-asa, kagalakan, at mga bagong makintab na oportunidad. Hayaang ang bagong edad na ito ay maging taon kung saan ang mga naantalang pangarap ay magsimulang matupad, kung saan makakahanap ka ng mga bagong kapana-panabik na pakikipagsapalaran, at kung saan si :name ay lalong lumalapit sa pinakamahusay na bersyon ng sarili.
            
            Laging tandaan, :name, na hindi ka kailanman mag-isa sa paglalakbay na ito. Maraming tao—pamilya, kaibigan, at mga kasamahan sa trabaho—na tunay na nagmamalasakit at handang suportahan ang bawat hakbang mo. Huwag mag-atubiling magbahagi ng mga paghihirap o magdiwang ng maliliit na tagumpay. Ipinagmamalaki naming lahat ang pagsusumikap at katapatan na laging ipinapakita ni :name sa pamumuhay. Si :name ay isang huwaran na dapat tularan.
            
            Nawa'y magdala ang taong ito ng bagong enerhiya para tuklasin ang mga bagong libangan, matuto ng mga bagong kasanayan, o simpleng maglaan ng mas maraming oras para magpahinga at tamasahin ang mga simpleng bagay. :name, unahin ang iyong kaligayahan at kapayapaan ng loob. Dahil kapag payapa ang iyong kaluluwa, lahat ng iyong ginagawa ay magpapakita ng mas magandang resulta. Karapat-dapat si :name sa lahat ng kabutihan sa mundo.
            
            Muli, Maligayang Kaarawan, :name! Tamasahin ang bawat sandali ng iyong espesyal na araw. Nawa'y mabuhay ka nang matagal, laging masaya, at laging maging inspirasyon sa aming lahat. Nawa'y laging ipagkaloob ng Diyos ang Kanyang biyaya at pagpapala sa iyong buhay. Mahal ka naming lahat at laging susuportahan, :name!
            """, false);
        
        // Hindi
        createTemplate(TemplateType.VIDEO, "hi", "हिंदी (Hindi)",
            """
            आज आपके लिए एक बहुत ही खास दिन है, :name, आपकी जीवन यात्रा में एक महत्वपूर्ण पड़ाव। मैं आपको सबसे हार्दिक जन्मदिन की शुभकामनाएं देना चाहता हूं। इस खुशी के दिन, :name ने जो भी अच्छाई और खुशी अपने आसपास के लोगों में बांटी है, वह आपको कई गुना वापस मिले। इस नई उम्र का स्वागत कृतज्ञता से भरे दिल और जलती हुई भावना के साथ करें, :name।
            
            बीते वर्षों को देखते हुए, हम देख सकते हैं कि :name ने कितनी उपलब्धियां और मूल्यवान सबक अनुभव किए हैं। आपने जो भी चुनौती पार की है, उसने आपको एक मजबूत, बुद्धिमान और प्रेरणादायक व्यक्ति के रूप में आकार दिया है। अपने आप को और उन सभी असाधारण चीजों का जश्न मनाएं जो :name ने अब तक की हैं। :name की उपस्थिति कई लोगों के लिए सकारात्मक प्रभाव और गर्मजोशी लाती है, और यह सबसे बड़ा अनमोल उपहार है।
            
            जीवन के इस नए अध्याय में प्रवेश करते हुए, :name, आपका मार्ग आशा, खुशी और शानदार नए अवसरों से प्रकाशित हो। इस नई उम्र को वह वर्ष बनने दें जहां टाले गए सपने सच होने लगें, जहां आप रोमांचक नए साहसिक कार्य खोजें, और जहां :name अपने सर्वश्रेष्ठ संस्करण के और करीब पहुंचें।
            
            हमेशा याद रखें, :name, कि इस यात्रा में आप कभी अकेले नहीं हैं। बहुत से लोग हैं—परिवार, दोस्त और सहकर्मी—जो वास्तव में आपकी परवाह करते हैं और आपके हर कदम का समर्थन करने के लिए तैयार हैं। कठिनाइयों को साझा करने या छोटी जीत का जश्न मनाने में संकोच न करें। हम सभी :name की मेहनत और ईमानदारी पर गर्व करते हैं जो जीवन जीने में हमेशा दिखती है। :name अनुकरणीय आदर्श हैं।
            
            इस वर्ष नई ऊर्जा लाए नए शौक तलाशने, नए कौशल सीखने, या बस आराम करने और सरल चीजों का आनंद लेने के लिए अधिक समय निकालने के लिए। :name, अपनी खुशी और आंतरिक शांति को प्राथमिकता दें। क्योंकि जब आपकी आत्मा शांत होती है, तो आप जो कुछ भी करते हैं वह अधिक सुंदर परिणाम प्रकट करेगा। :name दुनिया की सभी अच्छाइयों के योग्य हैं।
            
            एक बार फिर, जन्मदिन मुबारक हो, :name! अपने विशेष दिन के हर पल का आनंद लें। दीर्घायु हों, हमेशा खुश रहें, और हम सभी के लिए हमेशा प्रेरणा बने रहें। भगवान आपके जीवन पर हमेशा अपनी कृपा और आशीर्वाद बरसाएं। हम सभी आपसे प्यार करते हैं और हमेशा आपका समर्थन करते हैं, :name!
            """, false);
        
        // === WHATSAPP TEMPLATES ===
        
        // English (Default)
        createTemplate(TemplateType.WHATSAPP, "en", "English",
            """
            Hello :name!
            
            We have a special video for you.
            
            Click the following link to watch:
            :linkvideo
            
            Thank you!
            """, true);
        
        // Indonesian
        createTemplate(TemplateType.WHATSAPP, "id", "Bahasa Indonesia",
            """
            Halo :name!
            
            Kami punya video spesial untuk Anda.
            
            Klik link berikut untuk melihat:
            :linkvideo
            
            Terima kasih!
            """, false);
        
        // Chinese
        createTemplate(TemplateType.WHATSAPP, "zh", "中文 (Chinese)",
            """
            你好 :name！
            
            我们为您准备了一个特别的视频。
            
            点击以下链接观看：
            :linkvideo
            
            谢谢！
            """, false);
        
        // Japanese
        createTemplate(TemplateType.WHATSAPP, "ja", "日本語 (Japanese)",
            """
            こんにちは :name さん！
            
            特別なビデオをご用意しました。
            
            以下のリンクをクリックしてご覧ください：
            :linkvideo
            
            ありがとうございます！
            """, false);
        
        // Korean
        createTemplate(TemplateType.WHATSAPP, "ko", "한국어 (Korean)",
            """
            안녕하세요 :name님!
            
            특별한 영상을 준비했습니다.
            
            다음 링크를 클릭하여 시청하세요:
            :linkvideo
            
            감사합니다!
            """, false);
        
        // Thai
        createTemplate(TemplateType.WHATSAPP, "th", "ไทย (Thai)",
            """
            สวัสดี :name!
            
            เรามีวิดีโอพิเศษสำหรับคุณ
            
            คลิกลิงก์ต่อไปนี้เพื่อดู:
            :linkvideo
            
            ขอบคุณ!
            """, false);
        
        // Vietnamese
        createTemplate(TemplateType.WHATSAPP, "vi", "Tiếng Việt (Vietnamese)",
            """
            Xin chào :name!
            
            Chúng tôi có một video đặc biệt dành cho bạn.
            
            Nhấp vào liên kết sau để xem:
            :linkvideo
            
            Cảm ơn bạn!
            """, false);
        
        // Malay
        createTemplate(TemplateType.WHATSAPP, "ms", "Bahasa Melayu (Malay)",
            """
            Hai :name!
            
            Kami ada video istimewa untuk anda.
            
            Klik pautan berikut untuk menonton:
            :linkvideo
            
            Terima kasih!
            """, false);
        
        // Filipino
        createTemplate(TemplateType.WHATSAPP, "tl", "Filipino (Tagalog)",
            """
            Kumusta :name!
            
            May espesyal na video kami para sa iyo.
            
            I-click ang sumusunod na link para manood:
            :linkvideo
            
            Salamat!
            """, false);
        
        // Hindi
        createTemplate(TemplateType.WHATSAPP, "hi", "हिंदी (Hindi)",
            """
            नमस्ते :name!
            
            हमारे पास आपके लिए एक विशेष वीडियो है।
            
            देखने के लिए निम्न लिंक पर क्लिक करें:
            :linkvideo
            
            धन्यवाद!
            """, false);
        
        log.info("Default message templates seeded successfully!");
    }
    
    private void createTemplate(TemplateType type, String languageCode, String languageName, String template, boolean isDefault) {
        MessageTemplate messageTemplate = MessageTemplate.builder()
                .type(type)
                .languageCode(languageCode)
                .languageName(languageName)
                .template(template.trim())
                .isDefault(isDefault)
                .build();
        templateRepository.save(messageTemplate);
    }
    
    public List<MessageTemplate> getAllTemplates() {
        return templateRepository.findAllByOrderByTypeAscLanguageNameAsc();
    }
    
    public List<MessageTemplate> getTemplatesByType(TemplateType type) {
        return templateRepository.findByTypeOrderByLanguageNameAsc(type);
    }
    
    public Optional<MessageTemplate> getTemplate(TemplateType type, String languageCode) {
        return templateRepository.findByTypeAndLanguageCode(type, languageCode);
    }
    
    public MessageTemplate getDefaultTemplate(TemplateType type) {
        return templateRepository.findByTypeAndIsDefaultTrue(type)
                .orElseGet(() -> templateRepository.findByTypeAndLanguageCode(type, "en")
                        .orElse(null));
    }
    
    @Transactional
    public MessageTemplate saveTemplate(MessageTemplate template) {
        // If setting as default, unset other defaults of same type
        if (Boolean.TRUE.equals(template.getIsDefault())) {
            templateRepository.findByTypeAndIsDefaultTrue(template.getType())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(template.getId())) {
                            existing.setIsDefault(false);
                            templateRepository.save(existing);
                        }
                    });
        }
        return templateRepository.save(template);
    }
    
    @Transactional
    public MessageTemplate updateTemplate(Long id, String newTemplate, Boolean isDefault) {
        MessageTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        template.setTemplate(newTemplate);
        
        if (isDefault != null) {
            if (isDefault) {
                // Unset other defaults of same type
                templateRepository.findByTypeAndIsDefaultTrue(template.getType())
                        .ifPresent(existing -> {
                            if (!existing.getId().equals(id)) {
                                existing.setIsDefault(false);
                                templateRepository.save(existing);
                            }
                        });
            }
            template.setIsDefault(isDefault);
        }
        
        return templateRepository.save(template);
    }
    
    public void deleteTemplate(Long id) {
        templateRepository.deleteById(id);
    }
}
