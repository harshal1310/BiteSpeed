const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Sequelize, Op } = require('sequelize'); // Import Sequelize and Op
const sequelize = require('./DB/conn');
const Contact = require('./models/CustomerContacts');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" directory

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'check.html'));
});



// /identify endpoint
app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;
    console.log(req.body);

    try {
        // Find existing contacts
        const contacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    { email },
                    { phoneNumber }
                ]
            }
        });

        let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
        
        if (!primaryContact) {
            if (contacts.length > 0) {
                primaryContact = contacts[0];
                primaryContact.linkPrecedence = 'primary';
                await primaryContact.save();
            } else {
                // No existing contacts, create a new primary contact
                primaryContact = await Contact.create({
                    email,
                    phoneNumber,
                    linkPrecedence: 'primary'
                });
            }
        }

        else {
            for (const contact of contacts) {
                if (contact.id !== primaryContact.id) {
                
                    contact.linkedId = primaryContact.id;
                    contact.linkPrecedence = 'secondary';
                    await contact.save();
                }
            }
            const existingContact = contacts.find(c => c.email === email && c.phoneNumber === phoneNumber);
            if (!existingContact) {
            // Create the new contact and link it to the primary contact
            const newContact = await Contact.create({
                email,
                phoneNumber,
                linkPrecedence: 'secondary',
                linkedId: primaryContact.id
            });
        } 
        }

        // Create secondary contacts if needed
        for (const contact of contacts) {
            if (contact.id !== primaryContact.id && contact.linkedId === null) {
                contact.linkedId = primaryContact.id;
                contact.linkPrecedence = 'secondary';
                await contact.save();
            }
        }

        const secondaryContactIds = contacts
            .filter(c => c.id !== primaryContact.id)
            .map(c => c.id);

            const allContacts = await Contact.findAll({
                where: {
                    [Op.or]: [
                        { email },
                        { phoneNumber }
                    ]
                }
            });
    
            const uniqueEmails = [
                ...new Set(
                    allContacts
                        .map(c => c.email)
                        .filter(email => email && email.trim() !== '') // Remove null/undefined and empty emails
                )
            ];
    
            const uniquePhoneNumbers = [
                ...new Set(
                    allContacts
                        .map(c => c.phoneNumber)
                        .filter(phoneNumber => phoneNumber && phoneNumber.trim() !== '') // Remove null/undefined and empty phone numbers
                )
            ];
    

            res.json({
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: uniqueEmails,
                    phoneNumbers: uniquePhoneNumbers,
                    secondaryContactIds
                }
            })

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});




/*


// Gather all unique emails and phone numbers
   */