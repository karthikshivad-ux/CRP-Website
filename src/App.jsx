import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Radio,
  Users,
  Waves,
  X,
  ShipWheel
} from "lucide-react";

import "./App.css";
import "./AboutUs.css";

const phone = "9447152630";
const whatsappLink = `https://wa.me/91${phone}`;
const mapsLink =
  "https://www.google.com/maps/search/?api=1&query=Puthiyappa%2C%20Kozhikode%2C%20Kerala";

function GrowthMembership() {
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    place: "",
    phone: "",
    whatsapp: ""
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));

    if (field === "phone" && sameAsPhone) {
      setFormData((current) => ({
        ...current,
        phone: value,
        whatsapp: value
      }));
    }

    setError("");
  };

  const handleSameNumber = (checked) => {
    setSameAsPhone(checked);

    setFormData((current) => ({
      ...current,
      whatsapp: checked ? current.phone : ""
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.place.trim()) {
      setError("Please enter your place.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\d{10}$/.test(formData.whatsapp)) {
      setError("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/growth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          place: formData.place,
          phone: formData.phone,
          whatsapp: formData.whatsapp
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to register your membership details."
        );
      }

      setMessage(
        "Your details have been registered successfully. CRP will contact you regarding membership activation."
      );
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="membership-page">

      <div className="membership-glow membership-glow-one"></div>
      <div className="membership-glow membership-glow-two"></div>

      <header className="membership-header">

        <a className="brand" href="/">
          <img
            src="/crp-logo.png"
            alt="CRP"
            className="brand-logo"
          />
        </a>

        <a className="membership-back" href="/">
          <ArrowLeft size={17} />
          Back to CRP
        </a>

      </header>


      <main className="membership-main">

        <motion.div
          className="membership-intro"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >

          <div className="growth-badge">
            <Radio size={15} />
            GROWTH · MEMBERSHIP
          </div>

          <h1>
            Join the
            <br />
            <em>trade network.</em>
          </h1>

          <p>
            Get access to CRP's dedicated WhatsApp trade network
            for timely harbour and market information.
          </p>

        </motion.div>


        <motion.div
          className="membership-layout"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >

          <div className="membership-info">

            <div className="membership-price">

              <span>GROWTH MEMBERSHIP</span>

              <div>
                <strong>₹300</strong>
                <small>/ month</small>
              </div>

            </div>


            <div className="membership-benefits">

              <div>
                <Check size={17} />
                <span>Access to the GROWTH trade network</span>
              </div>

              <div>
                <Check size={17} />
                <span>Harbour-level availability information</span>
              </div>

              <div>
                <Check size={17} />
                <span>Direct WhatsApp trade communication</span>
              </div>

              <div>
                <Check size={17} />
                <span>Membership valid for one month</span>
              </div>

            </div>


            <div className="membership-note">

              <ShipWheel size={19} />

              <span>
                After successful payment, you will be added
                to the GROWTH WhatsApp group within 24 hours.
              </span>

            </div>

          </div>


          <form
            className="membership-form"
            onSubmit={handleSubmit}
          >

            <div className="form-heading">

              <span>01 / YOUR DETAILS</span>

              <h2>
                Tell us about yourself.
              </h2>

            </div>


            <div className="form-grid">

              <label>

                <span>FULL NAME</span>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  required
                />

              </label>


              <label>

                <span>BUSINESS NAME</span>

                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(event) =>
                    handleChange(
                      "businessName",
                      event.target.value
                    )
                  }
                  placeholder="Enter business name (optional)"
                />

              </label>


              <label>

                <span>PLACE</span>

                <input
                  type="text"
                  value={formData.place}
                  onChange={(event) =>
                    handleChange(
                      "place",
                      event.target.value
                    )
                  }
                  placeholder="City / Location"
                  required
                />

              </label>


              <label>

                <span>PHONE NUMBER</span>

                <div className="phone-input">

                  <span>+91</span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={formData.phone}
                    onChange={(event) =>
                      handleChange(
                        "phone",
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="10-digit number"
                    required
                  />

                </div>

              </label>

            </div>


            <label className="form-field-full">

              <span>WHATSAPP NUMBER</span>

              <div className="phone-input">

                <span>+91</span>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  value={formData.whatsapp}
                  onChange={(event) =>
                    handleChange(
                      "whatsapp",
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="10-digit WhatsApp number"
                  required
                />

              </div>

            </label>


            <label className="same-number">

              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(event) =>
                  handleSameNumber(
                    event.target.checked
                  )
                }
              />

              <span className="custom-checkbox">
                {sameAsPhone && <Check size={13} />}
              </span>

              <span>
                WhatsApp number is the same as phone number
              </span>

            </label>

            {error && (
              <div className="form-message">
                {error}
              </div>
            )}

            {message && (
              <div className="form-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="membership-submit"
              disabled={submitting}
            >
              {submitting ? "Registering..." : "Continue to Payment"}
              {!submitting && <ArrowUpRight size={18} />}
            </button>


            <p className="secure-note">
              Your details will be securely stored for membership
              registration and payment processing.
            </p>

          </form>

        </motion.div>

      </main>

    </div>
  );
}


function AboutUs() {
  const sections = [
    {
      number: "01",
      icon: <ShipWheel size={21} />,
      title: "Direct From Our Own Vessels",
      text: (
        <>
          A significant portion of the fish we source comes directly from <strong>our own fishing vessels</strong>. This gives us greater control over the sourcing process and helps us maintain consistency in the quality of the catch.
          <br /><br />
          Being directly involved at the sourcing stage allows us to handle the fish with greater care from the beginning, rather than relying entirely on multiple intermediaries. This direct connection to the source forms an important part of our commitment to quality.
          <br /><br />
          Our experience in the seafood industry, combined with our own vessels, enables us to build a reliable supply of fresh fish for our customers across different markets in India.
        </>
      )
    },
    {
      number: "02",
      icon: <Waves size={21} />,
      title: "Our Own Ice-Making Facilities",
      text: (
        <>
          Maintaining the freshness of fish requires an effective and uninterrupted cold chain. To support this, <strong>we operate our own ice factories</strong>, producing the ice used to preserve and pack our fish for transportation.
          <br /><br />
          Having our own ice-production facilities gives us greater control over an essential part of the preservation process. The ice is used during packing and transportation to help maintain the required temperature and protect the freshness of the fish while it travels to different destinations.
          <br /><br />
          This integrated approach reduces our dependence on external suppliers and allows us to better coordinate the handling and transportation process.
        </>
      )
    },
    {
      number: "03",
      icon: <Check size={21} />,
      title: "Hygienic Packing",
      text: (
        <>
          Proper handling and packing are essential when dealing with fresh seafood. At CRP, our fish is packed with a strong emphasis on <strong>hygiene, cleanliness, and proper handling</strong>.
          <br /><br />
          The fish is carefully prepared and packed with ice to help preserve its freshness during transportation. We follow a controlled packing process designed to minimize unnecessary handling and maintain the condition of the product from the time it is prepared until it reaches its destination.
          <br /><br />
          Our focus on hygienic packing is an important part of maintaining the quality standards that our customers expect from us.
        </>
      )
    },
    {
      number: "04",
      icon: <ArrowUpRight size={21} />,
      title: "Our Own Insulated Transportation",
      text: (
        <>
          Once the fish has been packed, maintaining the cold chain during transportation becomes equally important. To support this, <strong>we use our own insulated trucks</strong> for transporting fish across India.
          <br /><br />
          Our insulated vehicles help protect the fish from external temperature conditions during transit and support the preservation of freshness throughout the journey.
          <br /><br />
          Because the transportation is managed using our own fleet, we have greater control over the movement of our products and can coordinate transportation more efficiently according to the requirements of each shipment.
        </>
      )
    }
  ];

  return (
    <div className="about-page">
      <div className="about-page-glow about-page-glow-one"></div>
      <div className="about-page-glow about-page-glow-two"></div>

      <header className="about-page-header">
        <a className="brand" href="/">
          <img src="/crp-logo.png" alt="CRP" className="brand-logo" />
        </a>

        <a className="about-page-back" href="/">
          <ArrowLeft size={17} />
          Back to CRP
        </a>
      </header>

      <main>
        <section className="about-hero">
          <div className="about-hero-inner">
            <div className="growth-badge">
              <Waves size={15} />
              ABOUT CRP
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              From source to
              <br />
              <em>destination.</em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              At CRP, we are committed to delivering high-quality fresh fish with consistency, care, and reliability. Our approach is built around maintaining control over as much of the process as possible — from sourcing the catch to packing and transporting it to destinations across India.
            </motion.p>
          </div>
        </section>

        <section className="about-commitment">
          <div className="about-section-kicker">01 / OUR COMMITMENT</div>

          <div className="about-commitment-grid">
            <h2>
              Quality is built into
              <span>the journey.</span>
            </h2>

            <div>
              <p className="about-lead">
                By combining our own fishing vessels, ice-manufacturing facilities, hygienic packing practices, and insulated transportation, we are able to create a more controlled supply chain with minimal dependence on third parties.
              </p>
              <p>
                This allows us to focus on what matters most: <strong>preserving the freshness, quality, and condition of the fish throughout its journey.</strong>
              </p>
            </div>
          </div>
        </section>

        <section className="about-operations">
          <div className="about-section-kicker">02 / OUR OPERATIONS</div>

          <div className="about-operation-grid">
            {sections.map((section) => (
              <motion.article
                className="about-operation-card"
                key={section.number}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
              >
                <div className="about-operation-top">
                  <span>{section.number}</span>
                  <div>{section.icon}</div>
                </div>
                <h3>{section.title}</h3>
                <p>{section.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="about-supply">
          <div className="about-section-kicker">03 / AN INTEGRATED SUPPLY CHAIN</div>

          <div className="about-supply-card">
            <div>
              <div className="growth-badge">
                <Radio size={15} />
                CONTROLLED SUPPLY CHAIN
              </div>
              <h2>
                Our process brings
                <br />
                <em>every stage together.</em>
              </h2>
              <p>
                One of our greatest strengths is the level of integration across our operations.
              </p>
              <p>
                By managing multiple stages of the supply chain ourselves, we are able to reduce unnecessary third-party involvement and maintain greater control over the handling of our products.
              </p>
              <p>
                This integrated model helps us minimize interruptions, reduce unnecessary handling, and maintain better consistency throughout the journey of the fish.
              </p>
            </div>

            <div className="about-supply-flow">
              <div><ShipWheel size={20} /><span>Our Fishing Vessels</span></div>
              <span className="about-flow-arrow">→</span>
              <div><Waves size={20} /><span>Our Ice Factories</span></div>
              <span className="about-flow-arrow">→</span>
              <div><Check size={20} /><span>Hygienic Packing</span></div>
              <span className="about-flow-arrow">→</span>
              <div><ArrowUpRight size={20} /><span>Our Insulated Trucks</span></div>
              <span className="about-flow-arrow">→</span>
              <div><Users size={20} /><span>Customers Across India</span></div>
            </div>
          </div>
        </section>

        <section className="about-difference">
          <div className="about-section-kicker">04 / WHY OUR APPROACH MATTERS</div>

          <div className="about-difference-grid">
            <div>
              <h2>
                Fewer handovers.
                <br />
                <em>Greater control.</em>
              </h2>
            </div>

            <div>
              <p className="about-lead">
                Fresh fish requires careful handling at every stage. Quality can be affected by delays, excessive handling, inadequate cooling, or interruptions in transportation.
              </p>
              <p>
                Our vertically integrated approach is designed to address these challenges.
              </p>
              <p>
                With our own vessels, ice-production facilities, packing operations, and insulated transportation, we are able to maintain a greater degree of control over the journey of our products.
              </p>
              <p className="about-quote">
                Fewer unnecessary handovers mean greater control. Greater control helps us protect quality.
              </p>
              <p>
                This is what makes our approach different.
              </p>
            </div>
          </div>
        </section>

        <section className="about-india">
          <div className="about-india-card">
            <div className="about-india-copy">
              <div className="about-section-kicker light">05 / SERVING MARKETS ACROSS INDIA</div>
              <h2>
                Connecting the source
                <br />
                with markets across <em>India.</em>
              </h2>
              <p>
                Our operations are designed to support the transportation of fresh fish to customers and markets <strong>across India</strong>.
              </p>
              <p>
                Whether the destination is nearby or requires long-distance transportation, our focus remains the same: ensuring that the fish is properly handled, adequately chilled, hygienically packed, and transported under controlled conditions.
              </p>
              <p>
                Our infrastructure allows us to connect the source with markets across the country while maintaining our commitment to quality throughout the process.
              </p>
            </div>

            <div className="about-india-mark">
              <MapPin size={27} />
              <span>
                PUTHIYAPPA
                <small>KOZHIKODE · KERALA</small>
              </span>
            </div>
          </div>
        </section>

        <section className="about-quality">
          <div className="about-quality-inner">
            <div className="about-section-kicker">06 / BUILT AROUND QUALITY</div>
            <h2>
              Quality isn't a final step.
              <br />
              <em>It's built into every stage.</em>
            </h2>
            <p>
              At CRP, quality is not something we focus on only at the final stage. It is built into every step of our operation.
            </p>
            <p>
              From the moment the fish is sourced from our vessels, through ice production and hygienic packing, to transportation in our insulated trucks, every stage plays a role in protecting the freshness and quality of our products.
            </p>
            <p>
              Our integrated operations give us the ability to take greater responsibility for the entire process — and that is the foundation on which CRP continues to grow.
            </p>
            <div className="about-final-line">
              CRP — From Source to Destination, With Quality in Our Control.
            </div>
          </div>
        </section>
      </main>

      <footer className="about-page-footer">
        <span>© {new Date().getFullYear()} CRP</span>
        <span>Wholesale Fish · Puthiyappa · Kozhikode</span>
        <a href="/">Back to CRP ↑</a>
      </footer>
    </div>
  );
}

function App() {

  const [menuOpen, setMenuOpen] = useState(false);

  const [membershipPage, setMembershipPage] = useState(
    window.location.pathname === "/join-growth"
  );
  const [aboutPage, setAboutPage] = useState(
    window.location.pathname === "/about-us"
  );


  useEffect(() => {

    const handlePopState = () => {
      setMembershipPage(
        window.location.pathname === "/join-growth"
      );
      setAboutPage(
        window.location.pathname === "/about-us"
      );
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };

  }, []);


  const openAbout = (event) => {
    event.preventDefault();

    window.history.pushState({}, "", "/about-us");
    setMembershipPage(false);
    setAboutPage(true);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const openMembership = (event) => {

    event.preventDefault();

    window.history.pushState(
      {},
      "",
      "/join-growth"
    );

    setMembershipPage(true);
    setAboutPage(false);

    window.scrollTo(0, 0);
  };


  if (membershipPage) {
    return <GrowthMembership />;
  }

  if (aboutPage) {
    return <AboutUs />;
  }


  const reveal = {

    hidden: {
      opacity: 0,
      y: 35
    },

    visible: {

      opacity: 1,
      y: 0,

      transition: {
        duration: 0.7,
        ease: "easeOut"
      }

    }

  };


  return (
    <div className="site-shell">

      <header className="navbar">

        <a className="brand" href="#home">

          <img
            src="/crp-logo.png"
            alt="CRP"
            className="brand-logo"
          />

        </a>


        <nav className="nav-links">

          <a href="/about-us" onClick={openAbout}>
            About Us
          </a>

          <a href="#growth">
            GROWTH
          </a>

          <a href="#contact">
            Contact
          </a>

        </nav>


        <a
          className="nav-cta"
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
          <ArrowUpRight size={16} />
        </a>


        <button
          className="menu-toggle"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle menu"
        >

          {menuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}

        </button>


        {menuOpen && (

          <div className="mobile-menu">

            <a
              href="/about-us"
              onClick={openAbout}
            >
              About Us
            </a>

            <a
              href="#growth"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              GROWTH
            </a>

            <a
              href="#contact"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Contact
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              WhatsApp
            </a>

          </div>

        )}

      </header>


      <main>

        {/* HERO */}

        <section
          className="hero"
          id="home"
        >

          <div className="hero-glow glow-one"></div>

          <div className="hero-glow glow-two"></div>

          <div className="hero-grid"></div>


          <div className="hero-content">

            <motion.div
              className="eyebrow"
              initial={{
                opacity: 0,
                y: 18
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.7
              }}
            >

              <span className="live-dot"></span>

              WHOLESALE FISH NETWORK · KOZHIKODE

            </motion.div>


            <motion.h1
              initial={{
                opacity: 0,
                y: 25
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.8
              }}
            >

              Connecting the
              <br />

              <em>
                fish trade.
              </em>

            </motion.h1>


            <motion.p
              initial={{
                opacity: 0,
                y: 18
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.7,
                delay: 0.2
              }}
            >

              CRP is a wholesale fish business built around
              relationships, harbour networks and reliable market
              information across India.

            </motion.p>


            <motion.div
              className="hero-actions"
              initial={{
                opacity: 0,
                y: 18
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.7,
                delay: 0.3
              }}
            >

              <a
                className="button button-primary"
                href="#growth"
              >

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

            <span>
              SCROLL TO EXPLORE
            </span>

            <ArrowDown size={15} />

          </div>

        </section>


        {/* GROWTH */}

        <motion.section
          className="growth section reveal-section"
          id="growth"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.1
          }}
        >

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

                  <em>
                    available.
                  </em>

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


            <div className="growth-network">

              <motion.div
                className="network-node"
                whileHover={{
                  y: -6
                }}
                transition={{
                  duration: 0.25
                }}
              >

                <div className="network-icon">

                  <Waves size={20} />

                </div>

                <span>
                  HARBOURS
                </span>

                <small>
                  Across India
                </small>

              </motion.div>


              <div className="network-line">
                <span></span>
              </div>


              <motion.div
                className="network-node active"
                whileHover={{
                  y: -6
                }}
                transition={{
                  duration: 0.25
                }}
              >

                <div className="network-icon">

                  <Radio size={20} />

                </div>

                <span>
                  LIVE UPDATES
                </span>

                <small>
                  Real-time information
                </small>

              </motion.div>


              <div className="network-line">
                <span></span>
              </div>


              <motion.div
                className="network-node"
                whileHover={{
                  y: -6
                }}
                transition={{
                  duration: 0.25
                }}
              >

                <div className="network-icon">

                  <Users size={20} />

                </div>

                <span>
                  BUYERS
                </span>

                <small>
                  Trade network
                </small>

              </motion.div>

            </div>


            <div className="coming-soon">

              <div className="coming-icon">

                <ShipWheel size={23} />

              </div>


              <div>

                <span>
                  MEMBERSHIP ACCESS
                </span>

                <strong>
                  Registration Open
                </strong>

              </div>


              <div className="coming-line"></div>


              <span className="coming-note">

                Registration is open. CRP will contact you regarding membership activation.

              </span>

            </div>


            <a
              className="growth-join-button"
              href="/join-growth"
              onClick={openMembership}
            >

              Join GROWTH

              <ArrowUpRight size={18} />

            </a>

          </div>

        </motion.section>


        {/* CONTACT */}

        <motion.section
          className="contact section reveal-section"
          id="contact"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.12
          }}
        >

          <div className="section-kicker">
            03 / CONTACT CRP
          </div>


          <div className="contact-grid">

            <div>

              <h2>

                Let's talk

                <br />

                <em>
                  business.
                </em>

              </h2>


              <p className="lead">

                Need information, want to discuss a requirement,
                or simply want to connect with CRP?

              </p>

            </div>


            <motion.div
              className="contact-card"
              whileHover={{
                y: -5
              }}
              transition={{
                duration: 0.25
              }}
            >

              <div className="contact-row">

                <div className="contact-icon">

                  <Phone size={20} />

                </div>


                <div>

                  <span>
                    CALL / WHATSAPP
                  </span>


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

                  <span>
                    BASED IN
                  </span>


                  <strong>

                    Puthiyappa, Kozhikode, Kerala

                  </strong>

                </div>

              </div>


              <div className="contact-actions">

                <a
                  className="contact-button"
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                >

                  Open in Google Maps

                  <ArrowUpRight size={18} />

                </a>


                <a
                  className="contact-button contact-button-secondary"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >

                  WhatsApp CRP

                  <MessageCircle size={18} />

                </a>

              </div>

            </motion.div>

          </div>

        </motion.section>

      </main>


      <a
        className="floating-whatsapp"
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact CRP on WhatsApp"
      >

        <MessageCircle size={22} />

        <span>
          Chat with CRP
        </span>

      </a>


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