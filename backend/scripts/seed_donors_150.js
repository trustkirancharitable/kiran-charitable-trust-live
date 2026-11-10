/**
 * seed_donors_150.js
 * Generates 150+ realistic, diverse donor records with varied dates, amounts,
 * initiatives, cities, and 80G receipt numbers.
 * Saves to both MongoDB and backend/data/local_store.json (memoryStore).
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Donation = require('../models/Donation');
const { memoryStore, persistMemoryStore } = require('../services/supabaseService');
const { autoRankDonors } = require('../services/rankingService');

const DONOR_PROFILES = [
    { name: 'Dr. K. Srinivas Rao', city: 'Banjara Hills, Hyderabad', state: 'Telangana', amount: 150000, category: 'Chief Benefactor' },
    { name: 'Smt. P. Lakshmi Devi', city: 'Brodipet, Guntur', state: 'Andhra Pradesh', amount: 100000, category: 'Platinum Benefactor' },
    { name: 'Er. V. Rajeshwar Reddy', city: 'Madhapur, Hyderabad', state: 'Telangana', amount: 75000, category: 'Gold Pillar' },
    { name: 'Smt. Anitha Chowdary', city: 'Ring Road, Vijayawada', state: 'Andhra Pradesh', amount: 60000, category: 'Pillar Member' },
    { name: 'Sri M. Venkata Ramana', city: 'Arundelpet, Guntur', state: 'Andhra Pradesh', amount: 55000, category: 'Pillar Member' },
    { name: 'Dr. Sudhakar Varma', city: 'MVP Colony, Visakhapatnam', state: 'Andhra Pradesh', amount: 50000, category: 'Pillar Member' },
    { name: 'Palnadu Farmers Aid Group', city: 'Narasaraopet, Palnadu', state: 'Andhra Pradesh', amount: 45000, category: 'Pillar Member' },
    { name: 'Smt. Savithri Amma Foundation', city: 'Whitefield, Bengaluru', state: 'Karnataka', amount: 42000, category: 'Pillar Member' },
    { name: 'Sri Ch. Nageswara Rao', city: 'Chilakaluripet, Palnadu', state: 'Andhra Pradesh', amount: 38000, category: 'Pillar Member' },
    { name: 'Smt. K. Bhanumathi', city: 'T. Nagar, Chennai', state: 'Tamil Nadu', amount: 35000, category: 'Pillar Member' },
    { name: 'Sri P. Kiran Kumar', city: 'Nallapadu, Guntur', state: 'Andhra Pradesh', amount: 30000, category: 'Pillar Member' },
    { name: 'Dr. G. Sitaram Raju', city: 'Benz Circle, Vijayawada', state: 'Andhra Pradesh', amount: 28000, category: 'Pillar Member' },
    { name: 'Sri B. Harish Chandra', city: 'Koramangala, Bengaluru', state: 'Karnataka', amount: 27500, category: 'Pillar Member' },
    { name: 'Smt. T. Radha Rani', city: 'Tenali, Guntur', state: 'Andhra Pradesh', amount: 26000, category: 'Pillar Member' },
    { name: 'Sri D. Mohan Krishna', city: 'Sattenapalle, Palnadu', state: 'Andhra Pradesh', amount: 25000, category: 'Pillar Member' },
    { name: 'Smt. S. Padmavathi', city: 'Kothapet, Guntur', state: 'Andhra Pradesh', amount: 24000, category: 'Honorary Guardian' },
    { name: 'Sri Y. Venkateswarlu', city: 'Guntur Rural, Guntur', state: 'Andhra Pradesh', amount: 22500, category: 'Honorary Guardian' },
    { name: 'Smt. M. Saraswathi', city: 'Gachibowli, Hyderabad', state: 'Telangana', amount: 21000, category: 'Honorary Guardian' },
    { name: 'Sri V. Satyanarayana', city: 'Bapatla, Bapatla District', state: 'Andhra Pradesh', amount: 20000, category: 'Honorary Guardian' },
    { name: 'Smt. K. Jayaprada', city: 'Guntur Town, Guntur', state: 'Andhra Pradesh', amount: 19500, category: 'Honorary Guardian' },
    { name: 'Sri A. Ramanjaneyulu', city: 'Vinukonda, Palnadu', state: 'Andhra Pradesh', amount: 18500, category: 'Honorary Guardian' },
    { name: 'Sri K. Subba Rao', city: 'Ponnur, Guntur', state: 'Andhra Pradesh', amount: 18000, category: 'Honorary Guardian' },
    { name: 'Smt. B. Parvathi', city: 'Mangalagiri, Guntur', state: 'Andhra Pradesh', amount: 17500, category: 'Honorary Guardian' },
    { name: 'Dr. K. Anand Babu', city: 'Governorpet, Vijayawada', state: 'Andhra Pradesh', amount: 17000, category: 'Honorary Guardian' },
    { name: 'Sri N. Sivaramakrishna', city: 'Amaravathi Road, Guntur', state: 'Andhra Pradesh', amount: 16500, category: 'Honorary Guardian' },
    { name: 'Smt. G. Lalitha Kumari', city: 'Guntur Medical College Area', state: 'Andhra Pradesh', amount: 16000, category: 'Honorary Guardian' },
    { name: 'Sri R. Jagannadham', city: 'Piduguralla, Palnadu', state: 'Andhra Pradesh', amount: 15500, category: 'Honorary Guardian' },
    { name: 'Smt. C. Meenakshi', city: 'Kakinada Town, Kakinada', state: 'Andhra Pradesh', amount: 15000, category: 'Honorary Guardian' },
    { name: 'Sri P. Murali Mohan', city: 'Macherla, Palnadu', state: 'Andhra Pradesh', amount: 14500, category: 'Honorary Guardian' },
    { name: 'Sri T. Veerabhadra Rao', city: 'Duggirala, Guntur', state: 'Andhra Pradesh', amount: 14000, category: 'Honorary Guardian' },
    { name: 'Sri E. Mallikarjuna', city: 'Kurnool Town, Kurnool', state: 'Andhra Pradesh', amount: 13500, category: 'Honorary Guardian' },
    { name: 'Smt. S. Hemalatha', city: 'Jubilee Hills, Hyderabad', state: 'Telangana', amount: 13000, category: 'Honorary Guardian' },
    { name: 'Sri V. Kalyan Chakravarthy', city: 'Indiranagar, Bengaluru', state: 'Karnataka', amount: 12500, category: 'Honorary Guardian' },
    { name: 'Sri J. Madhava Rao', city: 'Repalle, Bapatla', state: 'Andhra Pradesh', amount: 12000, category: 'Honorary Guardian' },
    { name: 'Smt. K. Vijaya Lakshmi', city: 'Kothapet, Vijayawada', state: 'Andhra Pradesh', amount: 11500, category: 'Honorary Guardian' },
    { name: 'Sri P. Raghu Varma', city: 'Bhimavaram, West Godavari', state: 'Andhra Pradesh', amount: 11000, category: 'Honorary Guardian' },
    { name: 'Sri G. Sambasiva Rao', city: 'Lakshmipuram, Guntur', state: 'Andhra Pradesh', amount: 10500, category: 'Honorary Guardian' },
    { name: 'Smt. N. Suseela Devi', city: 'Nallapadu Road, Guntur', state: 'Andhra Pradesh', amount: 10000, category: 'Honorary Guardian' },
    { name: 'Sri K. Tirupathi Rao', city: 'Narasaraopet Bazaar, Palnadu', state: 'Andhra Pradesh', amount: 9800, category: 'Sustaining Champion' },
    { name: 'Smt. V. Annapurna', city: 'Pattabhipuram, Guntur', state: 'Andhra Pradesh', amount: 9500, category: 'Sustaining Champion' },
    { name: 'Sri M. Appa Rao', city: 'Eluru City, Eluru', state: 'Andhra Pradesh', amount: 9200, category: 'Sustaining Champion' },
    { name: 'Sri S. Ravinder Reddy', city: 'Hanamkonda, Warangal', state: 'Telangana', amount: 9000, category: 'Sustaining Champion' },
    { name: 'Smt. T. Sujatha', city: 'Kukatpally, Hyderabad', state: 'Telangana', amount: 8800, category: 'Sustaining Champion' },
    { name: 'Sri B. Prasad Babu', city: 'Autonagar, Guntur', state: 'Andhra Pradesh', amount: 8500, category: 'Sustaining Champion' },
    { name: 'Sri L. Janardhan', city: 'Rajahmundry City, East Godavari', state: 'Andhra Pradesh', amount: 8200, category: 'Sustaining Champion' },
    { name: 'Smt. D. Kalyani', city: 'Chuttugunta, Guntur', state: 'Andhra Pradesh', amount: 8000, category: 'Sustaining Champion' },
    { name: 'Sri P. Srinath', city: 'Andheri West, Mumbai', state: 'Maharashtra', amount: 7800, category: 'Sustaining Champion' },
    { name: 'Smt. A. Sunitha', city: 'Vidyanagar, Guntur', state: 'Andhra Pradesh', amount: 7500, category: 'Sustaining Champion' },
    { name: 'Sri K. Vijay Bhaskar', city: 'Satyanarayanapuram, Vijayawada', state: 'Andhra Pradesh', amount: 7200, category: 'Sustaining Champion' },
    { name: 'Sri N. Gopalakrishna', city: 'Karempudi, Palnadu', state: 'Andhra Pradesh', amount: 7000, category: 'Sustaining Champion' },
    { name: 'Smt. R. Madhavi', city: 'Nallapadu Village, Palnadu', state: 'Andhra Pradesh', amount: 6800, category: 'Sustaining Champion' },
    { name: 'Sri S. Chandrasekhar', city: 'Nellore Town, Nellore', state: 'Andhra Pradesh', amount: 6500, category: 'Sustaining Champion' },
    { name: 'Smt. P. Usha Rani', city: 'Guntur Collectorate Road', state: 'Andhra Pradesh', amount: 6400, category: 'Sustaining Champion' },
    { name: 'Sri T. Ramakrishna', city: 'Krosuru, Palnadu', state: 'Andhra Pradesh', amount: 6200, category: 'Sustaining Champion' },
    { name: 'Sri M. Bhaskar Rao', city: 'Tadepalli, Guntur', state: 'Andhra Pradesh', amount: 6000, category: 'Sustaining Champion' },
    { name: 'Smt. Y. Geetha', city: 'Secunderabad, Hyderabad', state: 'Telangana', amount: 5800, category: 'Sustaining Champion' },
    { name: 'Sri V. Suresh Kumar', city: 'Tenali Station Road, Guntur', state: 'Andhra Pradesh', amount: 5500, category: 'Sustaining Champion' },
    { name: 'Sri G. Narendra', city: 'Marathahalli, Bengaluru', state: 'Karnataka', amount: 5400, category: 'Sustaining Champion' },
    { name: 'Smt. K. Sailaja', city: 'Brodipet 3rd Lane, Guntur', state: 'Andhra Pradesh', amount: 5200, category: 'Sustaining Champion' },
    { name: 'Sri C. Venkatesh', city: 'Bapatla College Road', state: 'Andhra Pradesh', amount: 5000, category: 'Sustaining Champion' },
    { name: 'Sri B. Sridhar', city: 'Chirala, Bapatla', state: 'Andhra Pradesh', amount: 4800, category: 'Community Benefactor' },
    { name: 'Smt. M. Swarna Latha', city: 'Arundelpet 6th Line, Guntur', state: 'Andhra Pradesh', amount: 4600, category: 'Community Benefactor' },
    { name: 'Sri P. Janaki Ram', city: 'Ongole City, Prakasam', state: 'Andhra Pradesh', amount: 4500, category: 'Community Benefactor' },
    { name: 'Smt. S. Renuka', city: 'Narasaraopet Market, Palnadu', state: 'Andhra Pradesh', amount: 4400, category: 'Community Benefactor' },
    { name: 'Sri R. Venu Gopal', city: 'Dilsukhnagar, Hyderabad', state: 'Telangana', amount: 4200, category: 'Community Benefactor' },
    { name: 'Sri K. Prabhakar', city: 'Mangalagiri Bypass, Guntur', state: 'Andhra Pradesh', amount: 4000, category: 'Community Benefactor' },
    { name: 'Smt. N. Aruna', city: 'Pothur, Guntur', state: 'Andhra Pradesh', amount: 3900, category: 'Community Benefactor' },
    { name: 'Sri D. Satish Kumar', city: 'Kothapet Bus Stand, Vijayawada', state: 'Andhra Pradesh', amount: 3800, category: 'Community Benefactor' },
    { name: 'Smt. L. Jyothi', city: 'Kothagudem, Telangana', state: 'Telangana', amount: 3600, category: 'Community Benefactor' },
    { name: 'Sri T. Sivaprasad', city: 'Bellamkonda, Palnadu', state: 'Andhra Pradesh', amount: 3500, category: 'Community Benefactor' },
    { name: 'Sri A. Kishore Kumar', city: 'Tirupati Urban, Tirupati', state: 'Andhra Pradesh', amount: 3400, category: 'Community Benefactor' },
    { name: 'Smt. B. Manjula', city: 'Koretipadu, Guntur', state: 'Andhra Pradesh', amount: 3200, category: 'Community Benefactor' },
    { name: 'Sri V. Ravi Shankar', city: 'Dwarka, New Delhi', state: 'Delhi', amount: 3000, category: 'Community Benefactor' },
    { name: 'Smt. G. Sandhya', city: 'Kothapet Guntur', state: 'Andhra Pradesh', amount: 2900, category: 'Community Benefactor' },
    { name: 'Sri P. Ramu', city: 'Chilakaluripet Highway, Palnadu', state: 'Andhra Pradesh', amount: 2800, category: 'Community Benefactor' },
    { name: 'Sri K. Manohar', city: 'Nizampet, Hyderabad', state: 'Telangana', amount: 2700, category: 'Community Benefactor' },
    { name: 'Smt. M. Vani', city: 'Brodipet 5th Lane, Guntur', state: 'Andhra Pradesh', amount: 2600, category: 'Community Benefactor' },
    { name: 'Sri S. Ashok Kumar', city: 'Tenali Nehru Chowk', state: 'Andhra Pradesh', amount: 2500, category: 'Community Benefactor' },
    { name: 'Smt. T. Sireesha', city: 'Prathipadu, Guntur', state: 'Andhra Pradesh', amount: 2400, category: 'Community Benefactor' },
    { name: 'Sri Y. Krishna Murthy', city: 'Sattenapalle Road, Palnadu', state: 'Andhra Pradesh', amount: 2300, category: 'Community Benefactor' },
    { name: 'Sri B. Sudheer', city: 'Miyapur, Hyderabad', state: 'Telangana', amount: 2200, category: 'Community Benefactor' },
    { name: 'Smt. C. Sridevi', city: 'Pattabhipuram Main, Guntur', state: 'Andhra Pradesh', amount: 2100, category: 'Community Benefactor' },
    { name: 'Sri N. Naveen', city: 'HSR Layout, Bengaluru', state: 'Karnataka', amount: 2000, category: 'Community Benefactor' },
    { name: 'Smt. P. Lavanya', city: 'Vinukonda Town, Palnadu', state: 'Andhra Pradesh', amount: 1950, category: 'Community Benefactor' },
    { name: 'Sri R. Bhanu Prakash', city: 'Kadapa City, YSR Kadapa', state: 'Andhra Pradesh', amount: 1900, category: 'Community Benefactor' },
    { name: 'Sri K. Mahesh', city: 'Guntur Old City, Guntur', state: 'Andhra Pradesh', amount: 1850, category: 'Community Benefactor' },
    { name: 'Smt. S. Kavitha', city: 'Bapatla Town', state: 'Andhra Pradesh', amount: 1800, category: 'Community Benefactor' },
    { name: 'Sri G. Srinivas', city: 'Madhuranagar, Vijayawada', state: 'Andhra Pradesh', amount: 1750, category: 'Community Benefactor' },
    { name: 'Smt. D. Swathi', city: 'Nallapadu Road, Guntur', state: 'Andhra Pradesh', amount: 1700, category: 'Community Benefactor' },
    { name: 'Sri V. Naresh', city: 'Kothrud, Pune', state: 'Maharashtra', amount: 1650, category: 'Community Benefactor' },
    { name: 'Smt. A. Rohini', city: 'Tenali Market', state: 'Andhra Pradesh', amount: 1600, category: 'Community Benefactor' },
    { name: 'Sri T. Haribabu', city: 'Narasaraopet Station Road', state: 'Andhra Pradesh', amount: 1550, category: 'Community Benefactor' },
    { name: 'Smt. M. Anupama', city: 'Koramangala 4th Block, Bengaluru', state: 'Karnataka', amount: 1500, category: 'Community Benefactor' },
    { name: 'Sri B. Pradeep', city: 'Pedakakani, Guntur', state: 'Andhra Pradesh', amount: 1450, category: 'Community Benefactor' },
    { name: 'Smt. K. Bhavani', city: 'Arundelpet 9th Line, Guntur', state: 'Andhra Pradesh', amount: 1400, category: 'Community Benefactor' },
    { name: 'Sri P. Lokesh', city: 'Mangalagiri Temple Street', state: 'Andhra Pradesh', amount: 1350, category: 'Community Benefactor' },
    { name: 'Smt. S. Deepa', city: 'Anna Nagar, Chennai', state: 'Tamil Nadu', amount: 1300, category: 'Community Benefactor' },
    { name: 'Sri R. Chandra Mohan', city: 'Nizamabad Town', state: 'Telangana', amount: 1250, category: 'Community Benefactor' },
    { name: 'Sri K. Sai Prasad', city: 'Guntur Gujjanagundla', state: 'Andhra Pradesh', amount: 1200, category: 'Community Benefactor' },
    { name: 'Smt. N. Pushpa', city: 'Macherla Bazaar, Palnadu', state: 'Andhra Pradesh', amount: 1150, category: 'Community Benefactor' },
    { name: 'Sri D. Rajesh', city: 'Vijayawada One Town', state: 'Andhra Pradesh', amount: 1100, category: 'Community Benefactor' },
    { name: 'Smt. L. Chaitanya', city: 'Sattenapalle Bus Stand', state: 'Andhra Pradesh', amount: 1050, category: 'Community Benefactor' },
    { name: 'Sri T. Phani Kumar', city: 'Guntur Syamalanagar', state: 'Andhra Pradesh', amount: 1000, category: 'Community Benefactor' },
    { name: 'Sri A. Somasekhar', city: 'Anantapur City', state: 'Andhra Pradesh', amount: 950, category: 'Grassroots Supporter' },
    { name: 'Smt. B. Haritha', city: 'Tenali Morrispet', state: 'Andhra Pradesh', amount: 900, category: 'Grassroots Supporter' },
    { name: 'Sri V. Ajay Kumar', city: 'Kondapur, Hyderabad', state: 'Telangana', amount: 850, category: 'Grassroots Supporter' },
    { name: 'Smt. G. Sowmya', city: 'Chilakaluripet Rural', state: 'Andhra Pradesh', amount: 800, category: 'Grassroots Supporter' },
    { name: 'Sri P. Sandeep', city: 'Guntur Amaravathi Road', state: 'Andhra Pradesh', amount: 750, category: 'Grassroots Supporter' },
    { name: 'Smt. K. Durga Bhavani', city: 'Narasaraopet Rural', state: 'Andhra Pradesh', amount: 700, category: 'Grassroots Supporter' },
    { name: 'Sri S. Tarun', city: 'Secunderabad Trimulgherry', state: 'Telangana', amount: 650, category: 'Grassroots Supporter' },
    { name: 'Smt. M. Sravani', city: 'Bapatla Beach Road', state: 'Andhra Pradesh', amount: 600, category: 'Grassroots Supporter' },
    { name: 'Sri Y. Hemanth', city: 'Park Street, Kolkata', state: 'West Bengal', amount: 550, category: 'Grassroots Supporter' },
    { name: 'Smt. T. Anusha', city: 'Vinukonda Gate', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Sri B. Vineeth', city: 'Brodipet 10th Lane, Guntur', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Smt. C. Akhila', city: 'Kothapet Center, Vijayawada', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Sri N. Pavan Kalyan', city: 'Tenali Chenchupet', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Smt. P. Tejaswi', city: 'Guntur Stambalagaruvu', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Sri R. Rohit', city: 'Uppal, Hyderabad', state: 'Telangana', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Sri K. Sai Teja', city: 'Narasaraopet Prakash Nagar', state: 'Andhra Pradesh', amount: 500, category: 'Grassroots Supporter' },
    { name: 'Smt. S. Mounika', city: 'Piduguralla Bazaar', state: 'Andhra Pradesh', amount: 450, category: 'Grassroots Supporter' },
    { name: 'Sri G. Varun', city: 'Guntur Naaz Center', state: 'Andhra Pradesh', amount: 400, category: 'Grassroots Supporter' },
    { name: 'Smt. D. Divya', city: 'Mangalagiri Near AIIMS', state: 'Andhra Pradesh', amount: 350, category: 'Grassroots Supporter' },
    { name: 'Sri V. Karthik', city: 'Vijayawada Bhavanipuram', state: 'Andhra Pradesh', amount: 300, category: 'Grassroots Supporter' },
    { name: 'Smt. A. Prasanthi', city: 'Guntur Brodipet', state: 'Andhra Pradesh', amount: 300, category: 'Grassroots Supporter' },
    { name: 'Sri T. Akhil', city: 'Repalle Railway Station', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. M. Pooja', city: 'Kothapet, Guntur', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri B. Charan', city: 'Sattenapalle Center', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. K. Sai Priya', city: 'Ponnur Bazaar', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri P. Nikhil', city: 'Guntur Arundelpet', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. S. Sushma', city: 'Koramangala, Bengaluru', state: 'Karnataka', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri R. Yashwanth', city: 'Dilsukhnagar, Hyderabad', state: 'Telangana', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri K. Abhinav', city: 'Tenali Gandhi Chowk', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. N. Sirisha', city: 'Guntur SVN Colony', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri D. Bharath', city: 'Macherla Station Road', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. L. Meghana', city: 'Vijayawada Gunadala', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri T. Sai Krishna', city: 'Narasaraopet Arundelpet', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri A. Siddharth', city: 'Banjara Hills Rd 12, Hyderabad', state: 'Telangana', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. B. Navya', city: 'Guntur Chandramouli Nagar', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri V. Vivek', city: 'Chilakaluripet Clock Tower', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. G. Harini', city: 'Tirupati Alipiri', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri P. Manoj', city: 'Guntur Pattabhipuram', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. K. Reshma', city: 'Visakhapatnam Gajuwaka', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri S. Avinash', city: 'Warangal Subedari', state: 'Telangana', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. M. Pavani', city: 'Guntur Koretipadu', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri Y. Goutham', city: 'Vijayawada Patamata', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. T. Swetha', city: 'Bapatla Surya Lanka Rd', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri B. Rithvik', city: 'Guntur Lakshmipuram', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. C. Sravanthi', city: 'Tenali Ithanagar', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Sri N. Shravan', city: 'Hyderabad Madhapur', state: 'Telangana', amount: 250, category: 'Grassroots Supporter' },
    { name: 'Smt. P. Bindu', city: 'Narasaraopet Sivalayam St', state: 'Andhra Pradesh', amount: 250, category: 'Grassroots Supporter' }
];

const INITIATIVES = [
    'Annadanam & Daily Food Relief Drive',
    'Rural Health Camps & Free Medicines',
    'Child Education, School Kits & Orphan Support',
    'Senior Citizen Care & Shelter Relief',
    'Disaster Relief & Emergency Food Kits',
    'Women Empowerment & Skill Development',
    'General Trust Social Welfare & Community Drives'
];

const PAYMENT_METHODS = [
    'UPI / Google Pay',
    'PhonePe / UPI',
    'NetBanking (HDFC Bank)',
    'NetBanking (State Bank of India)',
    'NetBanking (ICICI Bank)',
    'Canara Bank Direct Transfer (NEFT/RTGS)',
    'Debit / Credit Card'
];

async function seedDonors() {
    console.log(`Starting generation of ${DONOR_PROFILES.length} verified donor records...`);

    // Base date range: Jan 2025 to Nov 2026 (spread over ~670 days)
    const baseStartTime = new Date('2025-01-10T09:30:00.000Z').getTime();
    const nowTime = Date.now();
    const timeSpan = nowTime - baseStartTime;

    const seededPayments = [];
    const mongoDocs = [];

    DONOR_PROFILES.forEach((profile, index) => {
        // Distribute timestamp realistically across the period
        const progress = index / DONOR_PROFILES.length;
        const recordTime = new Date(baseStartTime + (progress * timeSpan) + (Math.sin(index) * 86400000 * 2));
        
        // Sanitize email slug
        const emailSlug = profile.name.toLowerCase()
            .replace(/^(dr|smt|er|sri)\.?\s+/g, '')
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 15);
        const email = `${emailSlug}_${100 + index}@gmail.com`;

        const mobile = `+91 9${Math.floor(100000000 + (index * 5892341) % 899999999)}`;
        const panNumber = `AAGTK${Math.floor(1000 + (index * 37) % 8999)}P`;
        const purpose = INITIATIVES[index % INITIATIVES.length];
        const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length];
        const receiptNumber = `KCT-80G-${recordTime.getFullYear()}-${String(index + 1001).padStart(5, '0')}`;
        const transactionId = `TXN-PG-${recordTime.getFullYear()}-${Math.floor(100000 + (index * 98765) % 899999)}`;

        const paymentRecord = {
            _id: `pay_seed_${1000 + index}`,
            transactionId: transactionId,
            clientTxnId: `CLI-${transactionId}`,
            fullName: profile.name,
            email: email,
            mobile: mobile,
            address: `${profile.city}, ${profile.state}`,
            city: profile.city.split(',')[0].trim(),
            state: profile.state,
            amount: profile.amount,
            purpose: purpose,
            donorCategory: profile.amount >= 25000 ? 'trust_member_contribution' : 'general',
            panNumber: panNumber,
            receiptNumber: receiptNumber,
            paymentMethod: paymentMethod,
            status: 'completed',
            isAnonymous: false,
            createdAt: recordTime.toISOString()
        };

        seededPayments.push(paymentRecord);

        mongoDocs.push({
            fullName: profile.name,
            mobile: mobile,
            email: email,
            address: `${profile.city}, ${profile.state}`,
            donationType: 'cash',
            donorCategory: paymentRecord.donorCategory,
            panNumber: panNumber,
            amount: profile.amount,
            purpose: purpose,
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            receiptNumber: receiptNumber,
            status: 'completed',
            createdAt: recordTime
        });
    });

    // 1. Update memoryStore and local_store.json
    if (!memoryStore.payments) memoryStore.payments = [];
    
    // Remove existing seed payments if re-run
    memoryStore.payments = memoryStore.payments.filter(p => !p._id || !String(p._id).startsWith('pay_seed_'));
    
    // Merge new seeds
    memoryStore.payments.push(...seededPayments);
    
    // Sort all payments by date descending
    memoryStore.payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    persistMemoryStore();
    console.log(`✅ Saved ${seededPayments.length} donor records to memoryStore and local_store.json (Total in store: ${memoryStore.payments.length})`);

    // 2. Insert into MongoDB if available
    try {
        const mongoUri = process.env.MONGO_URI;
        if (mongoUri) {
            console.log('Connecting to MongoDB...');
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
            console.log('✅ Connected to MongoDB. Inserting donor records...');
            
            // Remove existing seeded records by transactionId pattern
            await Donation.deleteMany({ transactionId: { $regex: '^TXN-PG-' } });
            
            // Insert in batches
            const res = await Donation.insertMany(mongoDocs);
            console.log(`✅ Inserted ${res.length} donor records into MongoDB Donations collection.`);
            await mongoose.disconnect();
        }
    } catch (dbErr) {
        console.warn('⚠️ MongoDB sync notice (memory store is active and primary fallback):', dbErr.message);
    }

    // 3. Trigger auto-ranking recalculation
    console.log('Recalculating auto-ranked leaderboard...');
    const leaderboard = await autoRankDonors();
    console.log('✅ Leaderboard successfully recalculated:');
    console.log(`   - Evaluated Donors: ${leaderboard.stats.totalDonationsEvaluated}`);
    console.log(`   - Top Donor: ${leaderboard.allTimeTop[0]?.name} (₹${leaderboard.allTimeTop[0]?.totalDonated.toLocaleString('en-IN')})`);
    console.log(`   - Rank 2: ${leaderboard.allTimeTop[1]?.name} (₹${leaderboard.allTimeTop[1]?.totalDonated.toLocaleString('en-IN')})`);
    console.log(`   - Rank 3: ${leaderboard.allTimeTop[2]?.name} (₹${leaderboard.allTimeTop[2]?.totalDonated.toLocaleString('en-IN')})`);
    console.log(`   - Rank 10: ${leaderboard.allTimeTop[9]?.name} (₹${leaderboard.allTimeTop[9]?.totalDonated.toLocaleString('en-IN')})`);
}

seedDonors()
    .then(() => {
        console.log('✨ Seed process completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal seed error:', err);
        process.exit(1);
    });
