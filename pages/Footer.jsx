import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  TextField,
  Button,
  Divider,
  IconButton,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#fafafa',
        borderTop: '1px solid #ddd',
        py: { xs: 6, md: 8 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          justifyContent="space-between"
          alignItems="flex-start"
        >
          {/* Left Section: Logo & Address with Icons */}
          <Grid item xs={12} md={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              OTMT
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
                mb: 1,
              }}
            >
              <LocationOnIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              A-303, Academic Building, IIITD, Okhla Industrial Estate, Phase III
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
                mb: 1,
              }}
            >
              <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              011 - 26907550
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              alok@iiitd.ac.in
              </Typography>
            </Box>
          </Grid>

          {/* Menu Links with Hover Effects */}
          <Grid item xs={12} md={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Menu
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1,
              }}
            >
              {[
                'Home',
                'About',
                'Services',
                'Projects',
                'Technology',
                'Resources',
                'Collaborate',
              ].map((item) => (
                <Link
                  key={item}
                  href="#"
                  underline="hover"
                  sx={{
                    color: 'text.primary',
                    transition: 'color 0.3s, transform 0.3s',
                    '&:hover': { color: 'primary.main', transform: 'translateY(-2px)' },
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Get in Touch
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 400, mx: { xs: 'auto', md: 0 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: '#fff', borderRadius: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: '#fff', borderRadius: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: '#fff', borderRadius: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    sx={{ bgcolor: '#fff', borderRadius: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: '#000',
                      color: '#fff',
                      borderRadius: 0.5,
                      textTransform: 'none',
                      boxShadow: 'none',
                      px: 4,
                      py: 1.2,
                      transition: 'background-color 0.3s, transform 0.3s',
                      '&:hover': {
                        backgroundColor: '#333',
                        transform: 'translateY(-2px)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Social Media Icons with Hover Effects */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <IconButton
            href="#"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.3s, transform 0.3s',
              '&:hover': { color: 'black', transform: 'scale(1.1)' },
            }}
          >
            <FacebookIcon />
          </IconButton>
          <IconButton
            href="#"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.3s, transform 0.3s',
              '&:hover': { color: 'black', transform: 'scale(1.1)' },
            }}
          >
            <TwitterIcon />
          </IconButton>
          <IconButton
            href="#"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.3s, transform 0.3s',
              '&:hover': { color: 'black', transform: 'scale(1.1)' },
            }}
          >
            <InstagramIcon />
          </IconButton>
          <IconButton
            href="#"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.3s, transform 0.3s',
              '&:hover': { color: 'black', transform: 'scale(1.1)' },
            }}
          >
            <LinkedInIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#ddd' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © {new Date().getFullYear()} OTMT. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
