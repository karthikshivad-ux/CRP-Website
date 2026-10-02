import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
  Users,
  Waves,
  ShipWheel
} from "lucide-react";

import "./App.css";

const phone = "9447152630";
const whatsappLink = `https://wa.me/91${phone}`;

function App() {
  return (
    <div className="site-shell">

      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-mark">C</span>
          <span>CRP</span>
        </a>

        <nav className="nav-links">
          <a href="#about">About</a>
          <a href="#growth">GROWTH</a>
          <a href="#contact">Contact</a>
        </nav>

        <a
          className="nav-cta"
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp <ArrowUpRight size={16} />
        </a>
      </header>


      <main>

        {/* HERO */}

        <section className="hero" id="home">

          <div className="hero-glow glow-one"></div>
          <div className="hero-glow glow-two"></div>
          <div className="hero-grid"></div>

          <div className="hero-content">

            <motion.div
              className="eyebrow"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="live-dot"></span>
              WHOLESALE FISH NETWORK · KOZHIKODE
            </motion.div>


            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Connecting the
              <br />
              <em>fish trade.</em>
            </motion.h1>


            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              CRP is a wholesale fish business built around
              relationships, harbour networks and reliable market
              information across India.
            </motion.p>


            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >

              <a className="button button-primary" href="#growth">
                Explore GROWTH
                <ArrowDown size={17} />
              </a>

              <a
                className="button button-ghost"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                Talk to CRP
                <MessageCircle size={17} />
              </a>

            </motion.div>

          </div>


          <div className="hero-orbit">

            <div className="orbit-ring ring-one"></div>
            <div className="orbit-ring ring-two"></div>

            <div className="orbit-core">
              <Waves size={34} />
            </div>

            <span className="orbit-label label-a">
              KERALA
            </span>

            <span className="orbit-label label-b">
              INDIA
            </span>

            <span className="orbit-label label-c">
              HARBOURS
            </span>

          </div>


          <div className="scroll-cue">
            <span>SCROLL TO EXPLORE</span>
            <ArrowDown size={15} />
          </div>

        </section>


        {/* ABOUT */}

        <section className="intro section" id="about">

          <div className="section-kicker">
            01 / THE CRP NETWORK
          </div>

          <div className="intro-grid">

            <h2>
              Built around the
              <span> harbour.</span>
            </h2>

            <div>

              <p className="lead">
                CRP connects wholesale fish trade with the
                people and information that keep the market moving.
              </p>

              <p>
                From Puthiyappa, Kozhikode, we work through a
                network of buyers, sellers and harbour contacts.
                The focus is simple: strong connections, timely
                information and direct communication.
              </p>

            </div>

          </div>


          <div className="stats-row">

            <div className="stat">
              <Waves />
              <strong>01</strong>
              <span>Harbour-first approach</span>
            </div>

            <div className="stat">
              <Users />
              <strong>∞</strong>
              <span>People & trade connections</span>
            </div>

            <div className="stat">
              <Radio />
              <strong>LIVE</strong>
              <span>Market information</span>
            </div>

          </div>

        </section>


        {/* GROWTH */}

        <section className="growth section" id="growth">

          <div className="growth-card">

            <div className="growth-map-lines"></div>

            <div className="section-kicker light">
              02 / GROWTH
            </div>


            <div className="growth-copy">

              <div>

                <div className="growth-badge">
                  <Radio size={15} />
                  WHATSAPP TRADE NETWORK
                </div>

                <h2>
                  Know what's
                  <br />
                  <em>available.</em>
                </h2>

              </div>


              <div className="growth-description">

                <p className="lead">
                  GROWTH is CRP's dedicated WhatsApp community
                  for live fish availability updates from harbours
                  across India.
                </p>

                <p>
                  It is designed for people who need timely
                  information to make faster trade decisions —
                  bringing harbour-level availability closer to
                  the buyer.
                </p>

              </div>

            </div>


            <div className="coming-soon">

              <div className="coming-icon">
                <ShipWheel size={23} />
              </div>

              <div>
                <span>MEMBERSHIP ACCESS</span>
                <strong>Coming Soon</strong>
              </div>

              <div className="coming-line"></div>

              <span className="coming-note">
                Online membership & access system is under development.
              </span>

            </div>

          </div>

        </section>


        {/* CONTACT */}

        <section className="contact section" id="contact">

          <div className="section-kicker">
            03 / CONTACT CRP
          </div>


          <div className="contact-grid">

            <div>

              <h2>
                Let's talk
                <br />
                <em>business.</em>
              </h2>

              <p className="lead">
                Need information, want to discuss a requirement,
                or simply want to connect with CRP?
              </p>

            </div>


            <div className="contact-card">

              <div className="contact-row">

                <div className="contact-icon">
                  <Phone size={20} />
                </div>

                <div>
                  <span>CALL / WHATSAPP</span>

                  <a href={`tel:+91${phone}`}>
                    +91 {phone}
                  </a>
                </div>

              </div>


              <div className="contact-row">

                <div className="contact-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <span>BASED IN</span>

                  <strong>
                    Puthiyappa, Kozhikode, Kerala
                  </strong>
                </div>

              </div>


              <a
                className="contact-button"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                Start a conversation
                <ArrowUpRight size={18} />
              </a>

            </div>

          </div>

        </section>

      </main>


      <footer>

        <span>
          © {new Date().getFullYear()} CRP
        </span>

        <span>
          Wholesale Fish · Puthiyappa · Kozhikode
        </span>

        <a href="#home">
          Back to top ↑
        </a>

      </footer>

    </div>
  );
}

export default App;