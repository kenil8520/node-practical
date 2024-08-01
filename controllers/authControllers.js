const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require('sequelize');
const dotenv = require("dotenv");


dotenv.config();

const User = db.user;

const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password to login" });
    }

    const user = await User.findOne({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: "Incorrect email or password" });
    }

    const token = jwt.sign(
      {
        user: {
          name: user.name,
          email: user.email,
          id: user.id,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "15h" }
    );
    data = { name: user.name, email: user.email, accessToken: token };
    return res.status(200).json({ success: true, data: data, message: "Login successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Error in sign in" });
  }
};

const Postcard = db.postcard;

const generateUniqueLink = () => {
  const uuid = require('uuid');
  return uuid.v4();
}

const createPostCard = async (req, res) => {

  try {
    const userId = req.user.id;
    let filepath = null;
    if (req.file) {
      filepath = '/uploads/' + req.file.filename;
    }
    const { name, address, address2, city, state, zipcode, message, file } = req.body;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const addressRegex = /^[a-zA-Z0-9\s]+$/;
    const zipcodeRegex = /^[0-9]{6,9}$/;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({success: false, message: "Request body is empty provide name, address, city, state, zipcode and message"});
    }
    const requiredFields = ["name", "address", "city", "state", "zipcode", "message"];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    if (!nameRegex.test(name) || name.length > 20) {
      return res.status(400).json({ success: false, message: "Invalid name format" });
    }
    if (!nameRegex.test(city) || city.length > 20) {
      return res.status(400).json({ success: false, message: "Invalid city format" });
    }
    if (!nameRegex.test(state) || state.length > 20) {
      return res.status(400).json({ success: false, message: "Invalid state format" });
    }

    if (!addressRegex.test(address) || !addressRegex.test(address2)) {
      return res.status(400).json({ success: false, message: "Invalid address format" });
    }

    if (!zipcodeRegex.test(zipcode)) {
      return res.status(400).json({ success: false, message: "Invalid zipcode format" });
    }
    const uniqueLink = generateUniqueLink();
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + 1);

    const newProfile = await Postcard.create({
      recipient_name: name,
      street_1: address,
      street_2: address2,
      city: city,
      state: state,
      zipcode: zipcode,
      message: message,
      bg_image : filepath,
      link: uniqueLink,
      expireAt: expireAt,
      userId: userId
    });
    const link = 'http://localhost:8080/api/unique-postcard/' + uniqueLink;
    const responseData = {
      data: {
        recipient_name: newProfile.recipient_name,
        street_1: newProfile.street_1,
        street_2: newProfile.street_2,
        city: newProfile.city,
        state: newProfile.state,
        zipcode: newProfile.zipcode,
        message: newProfile.message,
        bg_image: filepath,
        link: link,
        expireAt: newProfile.expireAt,
      },
    };

    return res.status(201).json({ success: true, data: responseData.data, message: "Postcard created successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};


const listPostCard = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const options = {
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      where: {},
    };
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ auth: false, message: 'No Token Provided'});
    }
    else{
      const userId = req.user.id;
      options.where.userId = userId;
    }
    if (search) {
      options.where[Op.or] = [
        { recipient_name: { [Op.like]: `%${search}%` } },
        { street_1: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
        { zipcode: { [Op.like]: `%${search}%` } },

    ];
    }
    const totalCount = await Postcard.count({ where: options.where });
    const data = await Postcard.findAll(options);

    const customizedData = data.map(postcard => {
      const newLink = postcard.link;
      const filepath = 'http://localhost:8080/api/unique-postcard/' + newLink;

      return {
        recipient_name: postcard.recipient_name,
        street_1: postcard.street_1,
        street_2: postcard.street_2,
        city: postcard.city,
        state: postcard.state,
        zipcode: postcard.zipcode,
        message: postcard.message,
        bg_image: postcard.bg_image,
        link: filepath,
        tracker: postcard.tracker,
        createdAt: postcard.createdAt,
      };
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ success: true, message: "No postcard found" });
    }

    return res.status(200).json({
      success: true,
      data: customizedData,
      message: "Retrieved postcards successfully",
      currentPage: page,
      totatData: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    const errors = error.errors[0]?.message || error.message?.errors || error.errors ? errors: "Something went wrong";
    console.log(error);
    return res.status(400).json({ success: false, message: errors });
  }
};

const getPostcard = async (req, res) => {
  try {
    const id = req.params.link;
    const currentDate = Date.now()
    const data = await Postcard.findOne({ where: { link: id } });
    if (data.expireAt < currentDate){
      return res.status(400).json({ success: true, message: "Your link has been expired" });
    }
    const currentTrackerValue = data.tracker;
    const newTrackerValue = currentTrackerValue + 1;
    await Postcard.update({ tracker: newTrackerValue }, { where: { link: id } });
    const custommizeData = {
      id: data.id,
      recipient_name: data.recipient_name,
      street_1: data.street_1,
      city: data.city,
      state: data.state,
      zipcode: data.zipcode,
      message: data.message,
      createdAt: data.createdAt,
    };
    if (!data) {
      return res.status(404).json({ success: true, message: "No postcard found" });
    }
    return res.status(200).json({ success: true, data: custommizeData, message: "Retrieved postcard data" });
  } catch (error) {
    const errors = error.message || error.errors[0]?.message || error.message?.errors || error.errors || "Something went wrong";
    if (error.message && error.message.includes("Truncated incorrect DOUBLE value")) {
        return res.status(500).json({ success:false, error: 'Invalid postcard link' });
      }
    return res.status(400).json({ success: false, message: errors });
  }
};


const getPostcardById = async (req, res) => {
  try {

    const id = req.params.id;
    const data = await Postcard.findOne({ where: { id: id } });
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + 1);

    const uniqueLink = generateUniqueLink();
    const link = 'http://localhost:8080/api/unique-postcard/' + uniqueLink;

    await Postcard.update({ link: uniqueLink, expireAt: expireAt }, { where: { id: id } });

    const updatedData = await Postcard.findOne({ where: { id: id } });
    const customResponse = {
      data: {
        recipient_name: updatedData.recipient_name,
        street_1: updatedData.street_1,
        street_2: updatedData.street_2,
        city: updatedData.city,
        state: updatedData.state,
        zipcode: updatedData.zipcode,
        message: updatedData.message,
        bg_image: updatedData.bg_image,
        link: link,
        tracker: updatedData.tracker,
        expireAt: updatedData.expireAt,
        userId: updatedData.userId,
        createdAt: updatedData.createdAt,
      },
    };
    if (!data) {
      return res.status(404).json({ success: true, message: "No postcard found" });
    }
    return res.status(200).json({ success: true, data: customResponse.data, message: "Retrieved postcard data" });
  } catch (error) {
    const errors = error.message || error.errors[0]?.message || error.message?.errors || error.errors || "Something went wrong";
    if (error.message && error.message.includes("Truncated incorrect DOUBLE value")) {
        return res.status(500).json({ success:false, error: 'Invalid postcard link' });
      }
    return res.status(400).json({ success: false, message: errors });
  }
};

module.exports = {
  logIn,
  createPostCard,
  listPostCard,
  getPostcard,
  getPostcardById
};
